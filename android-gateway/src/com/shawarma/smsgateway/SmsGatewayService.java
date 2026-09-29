package com.shawarma.smsgateway;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.Socket;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.concurrent.CopyOnWriteArrayList;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

/**
 * 100% Native Foreground Service for Shawarma Nights Dukandar POS & SMS Gateway.
 * Maintains persistent WebSocket connection to the store server and synchronizes
 * all 8 Dukandar portal subsystems in real time:
 * 1. Orders
 * 2. Menu Items & Categories
 * 3. Deals & Hero Banner
 * 4. Customers Database
 * 5. Reviews & Ratings Moderation
 * 6. Store Settings & Brand Info
 * 7. SMS Gateway & SIM Telephony
 * 8. Real-time Kitchen Chime Audio Alerts
 */
public class SmsGatewayService extends Service {
    public static final String TAG = "ShawarmaSMS";
    private static final String CHANNEL_ID = "sms_gateway_channel";

    private static SmsGatewayService instance = null;
    private static final String GATEWAY_SECRET = "sn_dev_gateway_secret_local";
    public static final String DEFAULT_SERVER_IP = "churuone-backend.onrender.com";

    public static String resolveHttpBase(String hostOrIp) {
        if (hostOrIp == null || hostOrIp.trim().isEmpty()) {
            return "https://churuone-backend.onrender.com";
        }
        String clean = hostOrIp.trim().replaceAll("^https?://", "").replaceAll("^wss?://", "").replaceAll("/.*$", "");
        if (clean.contains("trycloudflare.com") || clean.endsWith(".com") || clean.endsWith(".in") || clean.endsWith(".org") || clean.endsWith(".net") || clean.endsWith(".app")) {
            return "https://" + clean;
        }
        if (clean.contains(":")) {
            return "http://" + clean;
        }
        return "http://" + clean + ":5001";
    }

    public static String resolveWsUrl(String hostOrIp) {
        if (hostOrIp == null || hostOrIp.trim().isEmpty()) {
            return "wss://churuone-backend.onrender.com/gateway";
        }
        String clean = hostOrIp.trim().replaceAll("^https?://", "").replaceAll("^wss?://", "").replaceAll("/.*$", "");
        if (clean.contains("trycloudflare.com") || clean.endsWith(".com") || clean.endsWith(".in") || clean.endsWith(".org") || clean.endsWith(".net") || clean.endsWith(".app")) {
            return "wss://" + clean + "/gateway";
        }
        if (clean.contains(":")) {
            return "ws://" + clean + "/gateway";
        }
        return "ws://" + clean + ":5001/gateway";
    }

    public static String getConfiguredServerIp(Context context) {
        if (context == null) return DEFAULT_SERVER_IP;
        try {
            SharedPreferences prefs = context.getSharedPreferences("shawarma_gateway_prefs", Context.MODE_PRIVATE);
            return prefs.getString("server_ip", DEFAULT_SERVER_IP);
        } catch (Exception e) {
            return DEFAULT_SERVER_IP;
        }
    }

    public static void setConfiguredServerIp(Context context, String ip) {
        if (context == null || ip == null || ip.trim().isEmpty()) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences("shawarma_gateway_prefs", Context.MODE_PRIVATE);
            prefs.edit().putString("server_ip", ip.trim()).apply();
            if (instance != null) {
                instance.reconnectNow();
            }
        } catch (Exception ignored) {}
    }

    public static String[] getHostBases() {
        String configuredIp = instance != null ? getConfiguredServerIp(instance) : DEFAULT_SERVER_IP;
        java.util.LinkedHashSet<String> set = new java.util.LinkedHashSet<>();
        set.add("https://churuone-backend.onrender.com");
        if (configuredIp != null && !configuredIp.trim().isEmpty()) {
            set.add(resolveHttpBase(configuredIp));
        }
        set.add("http://10.166.13.97:5001");
        set.add("http://127.0.0.1:5001");
        return set.toArray(new String[0]);
    }

    private String[] getServerUrls() {
        String configuredIp = getConfiguredServerIp(this);
        java.util.LinkedHashSet<String> set = new java.util.LinkedHashSet<>();
        set.add("wss://churuone-backend.onrender.com/gateway");
        if (configuredIp != null && !configuredIp.trim().isEmpty()) {
            set.add(resolveWsUrl(configuredIp));
        }
        set.add("ws://10.166.13.97:5001/gateway");
        set.add("ws://127.0.0.1:5001/gateway");
        return set.toArray(new String[0]);
    }

    public void reconnectNow() {
        if (handler != null) {
            handler.post(() -> {
                isWsConnected = false;
                try {
                    if (socket != null) socket.close();
                } catch (Exception ignored) {}
                currentUrlIndex = 0;
                connectWebSocket();
            });
        }
    }

    // 100% Server-Sourced In-Memory Collections (Zero Dummy Fallback)
    public static final List<JSONObject> ordersList = new CopyOnWriteArrayList<>();
    public static final List<JSONObject> menuList = new CopyOnWriteArrayList<>();
    public static final List<JSONObject> categoriesList = new CopyOnWriteArrayList<>();
    public static final List<JSONObject> dealsList = new CopyOnWriteArrayList<>();
    public static final List<JSONObject> reviewsList = new CopyOnWriteArrayList<>();
    public static final List<JSONObject> customersList = new CopyOnWriteArrayList<>();
    public static volatile JSONObject storeInfoObj = new JSONObject();
    public static volatile JSONObject heroBannerObj = new JSONObject();
    public static final List<String> smsLogs = new CopyOnWriteArrayList<>();
    public static volatile String currentUpiId = "";
    public static volatile int smsSentToday = 0;
    public static volatile boolean isWsConnected = false;
    public static volatile String activeServerHost = "127.0.0.1";

    public interface StateChangeListener {
        void onDataChanged();
        void onConnectionStatusChanged(boolean connected, String host);
        void onSmsLogAdded(String log);
    }

    private static final List<StateChangeListener> listeners = new CopyOnWriteArrayList<>();

    public static void registerListener(StateChangeListener listener) {
        if (listener != null && !listeners.contains(listener)) {
            listeners.add(listener);
        }
    }

    public static void unregisterListener(StateChangeListener listener) {
        listeners.remove(listener);
    }

    public static void notifyDataChanged() {
        new Handler(Looper.getMainLooper()).post(() -> {
            for (StateChangeListener l : listeners) {
                try { l.onDataChanged(); } catch (Throwable ignored) {}
            }
        });
    }

    private static void notifyConnectionChanged(boolean connected, String host) {
        new Handler(Looper.getMainLooper()).post(() -> {
            for (StateChangeListener l : listeners) {
                try { l.onConnectionStatusChanged(connected, host); } catch (Throwable ignored) {}
            }
        });
    }

    private static void notifySmsLog(String log) {
        new Handler(Looper.getMainLooper()).post(() -> {
            for (StateChangeListener l : listeners) {
                try { l.onSmsLogAdded(log); } catch (Throwable ignored) {}
            }
        });
    }

    public static boolean isConnected() {
        return instance != null && isWsConnected;
    }

    public static SmsGatewayService getInstance() {
        return instance;
    }

    private HandlerThread handlerThread;
    private Handler handler;
    private volatile boolean isRunning = false;
    private int currentUrlIndex = 0;
    private int reconnectDelay = 1000;
    private static final int MAX_RECONNECT_DELAY = 15000;
    private PowerManager.WakeLock wakeLock;

    private Socket socket;
    private OutputStream outputStream;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        Log.i(TAG, "SmsGatewayService created");
        createNotificationChannel();

        handlerThread = new HandlerThread("SmsGatewayThread");
        handlerThread.start();
        handler = new Handler(handlerThread.getLooper());

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SmsGateway:WakeLock");
            wakeLock.acquire();
        }

        addSmsLog("Dukandar Real-Time Engine Active");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "SmsGatewayService started");
        startForeground(1, buildNotification("Connecting to Shawarma Cloud Server..."));
        isRunning = true;
        
        // Initial REST sync in background for immediate UI populating
        fetchInitialRestData();

        // Connect WebSocket
        handler.post(this::connectWebSocket);

        // 24/7 Cloud Keep-Alive: Ping Render server every 7 minutes so it never spins down
        startCloudKeepAliveTimer();
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        Log.i(TAG, "SmsGatewayService destroyed");
        instance = null;
        isRunning = false;
        isWsConnected = false;
        notifyConnectionChanged(false, "");
        try {
            if (socket != null) socket.close();
        } catch (Exception ignored) {}
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        if (handlerThread != null) {
            handlerThread.quitSafely();
        }
        super.onDestroy();
    }

    /**
     * 24/7 Cloud Keep-Alive Heartbeat:
     * Pings Render cloud server every 7 minutes so Render never goes to sleep.
     */
    private void startCloudKeepAliveTimer() {
        if (handler == null) return;
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!isRunning) return;
                new Thread(() -> {
                    try {
                        URL url = new URL("https://churuone-backend.onrender.com/healthz");
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setConnectTimeout(5000);
                        conn.setReadTimeout(5000);
                        conn.setRequestMethod("GET");
                        int code = conn.getResponseCode();
                        conn.disconnect();
                        Log.d(TAG, "💓 [Cloud Keep-Alive] Pinged Render: HTTP " + code);
                    } catch (Exception ignored) {}
                }).start();
                if (handler != null && isRunning) {
                    handler.postDelayed(this, 7 * 60 * 1000); // Repeat every 7 minutes
                }
            }
        }, 15 * 1000); // First ping after 15 seconds
    }

    /**
     * REST fallback helper for instantaneous data loading from server
     */
    public void fetchInitialRestData() {
        new Thread(() -> {
            String[] hosts = getHostBases();
            
            // 1. Fetch Store DB (/api/data)
            for (String base : hosts) {
                try {
                    URL url = new URL(base + "/api/data");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(2500);
                    conn.setReadTimeout(2500);
                    conn.setRequestMethod("GET");
                    if (conn.getResponseCode() == 200) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) sb.append(line);
                        reader.close();
                        JSONObject data = new JSONObject(sb.toString());
                        parseFullState(data);
                        Log.i(TAG, "Initial REST state synced from " + base + "/api/data");
                        break;
                    }
                } catch (Exception ignored) {}
            }

            // 2. Fetch Customers DB (/api/admin/customers)
            for (String base : hosts) {
                try {
                    URL url = new URL(base + "/api/admin/customers");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(2500);
                    conn.setReadTimeout(2500);
                    conn.setRequestMethod("GET");
                    if (conn.getResponseCode() == 200) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) sb.append(line);
                        reader.close();
                        JSONObject data = new JSONObject(sb.toString());
                        JSONArray custArr = data.optJSONArray("customers");
                        if (custArr != null) {
                            customersList.clear();
                            for (int i = 0; i < custArr.length(); i++) {
                                customersList.add(custArr.getJSONObject(i));
                            }
                            notifyDataChanged();
                            Log.i(TAG, "Customers synced: " + customersList.size());
                        }
                        break;
                    }
                } catch (Exception ignored) {}
            }
        }).start();
    }

    private void connectWebSocket() {
        if (!isRunning) return;

        String[] urls = getServerUrls();
        if (currentUrlIndex >= urls.length) currentUrlIndex = 0;
        String baseUrl = urls[currentUrlIndex];
        try {
            String urlStr = baseUrl + "?token=" + GATEWAY_SECRET;
            Log.i(TAG, "Connecting to: " + baseUrl);
            URI uri = new URI(urlStr);
            String host = uri.getHost();
            activeServerHost = baseUrl.contains("127.0.0.1") ? "127.0.0.1 (USB)" : host + " (Wi-Fi)";
            updateNotification("Connecting to " + activeServerHost + "...");
            notifyConnectionChanged(false, activeServerHost);
            int port = uri.getPort();
            String scheme = uri.getScheme();
            boolean isSecure = "wss".equalsIgnoreCase(scheme);
            if (port == -1) port = isSecure ? 443 : 80;

            if (isSecure) {
                SSLContext sslContext = SSLContext.getInstance("TLS");
                sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                    public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                    public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                }}, new SecureRandom());
                SSLSocketFactory factory = sslContext.getSocketFactory();
                SSLSocket sslSocket = (SSLSocket) factory.createSocket(host, port);
                try {
                    java.lang.reflect.Method setHostnameMethod = sslSocket.getClass().getMethod("setHostname", String.class);
                    setHostnameMethod.invoke(sslSocket, host);
                } catch (Exception ignored) {}
                socket = sslSocket;
            } else {
                socket = new Socket(host, port);
            }
            socket.setSoTimeout(45000);

            outputStream = socket.getOutputStream();
            InputStream inputStream = socket.getInputStream();

            String path = uri.getRawPath();
            if (path == null || path.isEmpty()) path = "/";
            if (uri.getRawQuery() != null) path += "?" + uri.getRawQuery();

            String hostHeader = (port == 80 || port == 443) ? host : host + ":" + port;
            String wsKey = generateWebSocketKey();
            String handshake = "GET " + path + " HTTP/1.1\r\n"
                    + "Host: " + hostHeader + "\r\n"
                    + "Upgrade: websocket\r\n"
                    + "Connection: Upgrade\r\n"
                    + "Sec-WebSocket-Key: " + wsKey + "\r\n"
                    + "Sec-WebSocket-Version: 13\r\n"
                    + "\r\n";

            outputStream.write(handshake.getBytes(StandardCharsets.UTF_8));
            outputStream.flush();

            // Read HTTP 101 response byte-by-byte so nothing beyond \r\n\r\n is swallowed into a buffer
            ByteArrayOutputStream headerBuf = new ByteArrayOutputStream();
            int consecutiveEnds = 0;
            while (true) {
                int b = inputStream.read();
                if (b == -1) throw new Exception("Socket closed during handshake");
                headerBuf.write(b);
                if (b == '\r' && (consecutiveEnds == 0 || consecutiveEnds == 2)) {
                    consecutiveEnds++;
                } else if (b == '\n' && (consecutiveEnds == 1 || consecutiveEnds == 3)) {
                    consecutiveEnds++;
                    if (consecutiveEnds == 4) break; // Reached \r\n\r\n
                } else {
                    consecutiveEnds = (b == '\r') ? 1 : 0;
                }
            }

            String responseHeaders = new String(headerBuf.toByteArray(), StandardCharsets.UTF_8);
            if (!responseHeaders.contains("101")) {
                throw new Exception("Handshake failed: " + responseHeaders);
            }

            isWsConnected = true;
            reconnectDelay = 1000;
            Log.i(TAG, "Connected to Shawarma Server via " + baseUrl);
            updateNotification("● Connected | SIM Active (" + activeServerHost + ")");
            notifyConnectionChanged(true, activeServerHost);
            sendStateBroadcast(true);

            // Request full state
            sendWsMessage("{\"action\":\"GET_INITIAL_STATE\"}");

            // WebSocket frame reading loop
            while (isRunning && isWsConnected) {
                int b1 = inputStream.read();
                if (b1 == -1) break;

                int opcode = b1 & 0x0F;
                int b2 = inputStream.read();
                if (b2 == -1) break;

                boolean masked = (b2 & 0x80) != 0;
                long len = b2 & 0x7F;

                if (len == 126) {
                    int h = inputStream.read();
                    int l = inputStream.read();
                    if (h == -1 || l == -1) break;
                    len = ((h & 0xFF) << 8) | (l & 0xFF);
                } else if (len == 127) {
                    byte[] lBuf = new byte[8];
                    int r = 0;
                    while (r < 8) {
                        int count = inputStream.read(lBuf, r, 8 - r);
                        if (count == -1) break;
                        r += count;
                    }
                    if (r < 8) break;
                    len = 0;
                    for (int i = 0; i < 8; i++) {
                        len = (len << 8) | (lBuf[i] & 0xFFL);
                    }
                }

                byte[] mask = new byte[4];
                if (masked) {
                    int r = 0;
                    while (r < 4) {
                        int count = inputStream.read(mask, r, 4 - r);
                        if (count == -1) break;
                        r += count;
                    }
                    if (r < 4) break;
                }

                byte[] payload = new byte[(int) len];
                int totalRead = 0;
                while (totalRead < len) {
                    int r = inputStream.read(payload, totalRead, (int) len - totalRead);
                    if (r == -1) break;
                    totalRead += r;
                }

                if (masked) {
                    for (int i = 0; i < len; i++) {
                        payload[i] = (byte) (payload[i] ^ mask[i % 4]);
                    }
                }

                if (opcode == 0x01) { // Text frame
                    String msg = new String(payload, StandardCharsets.UTF_8);
                    handleIncomingServerMessage(msg);
                } else if (opcode == 0x08) { // Close
                    break;
                } else if (opcode == 0x09) { // Ping -> Pong
                    sendWsPong(payload);
                }
            }

        } catch (Exception e) {
            Log.e(TAG, "WebSocket error (" + baseUrl + "): " + e.getMessage());
        } finally {
            isWsConnected = false;
            notifyConnectionChanged(false, "");
            sendStateBroadcast(false);
            try {
                if (socket != null) socket.close();
            } catch (Exception ignored) {}
        }

        if (isRunning) {
            // Alternate between USB and Wi-Fi endpoints
            currentUrlIndex = (currentUrlIndex + 1) % getServerUrls().length;
            Log.i(TAG, "Reconnecting in " + (reconnectDelay / 1000) + " seconds...");
            updateNotification("Connecting in " + (reconnectDelay / 1000) + "s...");
            handler.postDelayed(this::connectWebSocket, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
        }
    }

    private void handleIncomingServerMessage(String rawJson) {
        try {
            JSONObject root = new JSONObject(rawJson);
            String action = root.optString("action", root.optString("type", ""));

            Log.i(TAG, "Incoming WS action: " + action);

            if ("INIT_STATE".equals(action)) {
                JSONObject payload = root.optJSONObject("payload");
                if (payload != null) {
                    parseFullState(payload);
                }
            } else if ("ORDER_CREATED".equals(action)) {
                JSONObject order = root.optJSONObject("payload");
                if (order == null && root.has("order")) order = root.optJSONObject("order");
                if (order != null) {
                    ordersList.add(0, order);
                    notifyDataChanged();
                    AudioAlertManager.playOrderChime(getApplicationContext());
                    updateNotification("New Order #" + order.optString("id") + " Received!");
                    addSmsLog("New Order: #" + order.optString("id") + " (₹" + order.optDouble("total") + ")");
                }
            } else if ("ORDER_UPDATED".equals(action) || "ORDER_STATUS_CHANGED".equals(action)) {
                JSONObject payload = root.optJSONObject("payload");
                if (payload != null) {
                    String orderId = payload.optString("orderId");
                    String status = payload.optString("status");
                    for (JSONObject o : ordersList) {
                        if (o.optString("id").equals(orderId)) {
                            o.put("status", status);
                            break;
                        }
                    }
                    notifyDataChanged();
                }
            } else if ("MENU_UPDATED".equals(action)) {
                JSONArray menuArr = root.optJSONArray("payload");
                if (menuArr != null) {
                    menuList.clear();
                    for (int i = 0; i < menuArr.length(); i++) {
                        menuList.add(menuArr.getJSONObject(i));
                    }
                    notifyDataChanged();
                }
            } else if ("CATEGORIES_UPDATED".equals(action)) {
                JSONArray catArr = root.optJSONArray("payload");
                if (catArr != null) {
                    categoriesList.clear();
                    for (int i = 0; i < catArr.length(); i++) {
                        categoriesList.add(catArr.getJSONObject(i));
                    }
                    notifyDataChanged();
                }
            } else if ("DEALS_UPDATED".equals(action)) {
                JSONArray dealsArr = root.optJSONArray("payload");
                if (dealsArr != null) {
                    dealsList.clear();
                    for (int i = 0; i < dealsArr.length(); i++) {
                        dealsList.add(dealsArr.getJSONObject(i));
                    }
                    notifyDataChanged();
                }
            } else if ("HERO_UPDATED".equals(action)) {
                JSONObject hero = root.optJSONObject("payload");
                if (hero != null) {
                    heroBannerObj = hero;
                    notifyDataChanged();
                }
            } else if ("STORE_INFO_UPDATED".equals(action)) {
                JSONObject storeInfo = root.optJSONObject("payload");
                if (storeInfo != null) {
                    storeInfoObj = storeInfo;
                    JSONObject payment = storeInfo.optJSONObject("payment");
                    if (payment != null && payment.has("upiId")) {
                        currentUpiId = payment.optString("upiId");
                    }
                    notifyDataChanged();
                }
            } else if ("REVIEW_ADDED".equals(action)) {
                JSONObject rev = root.optJSONObject("payload");
                if (rev != null) {
                    reviewsList.add(0, rev);
                    notifyDataChanged();
                }
            } else if ("CUSTOMERS_LIST".equals(action)) {
                JSONArray custArr = root.optJSONArray("payload");
                if (custArr != null) {
                    customersList.clear();
                    for (int i = 0; i < custArr.length(); i++) {
                        customersList.add(custArr.getJSONObject(i));
                    }
                    notifyDataChanged();
                }
            } else if ("SEND_SMS".equals(action)) {
                String phone = root.optString("phone");
                String message = root.optString("message");
                String requestId = root.optString("requestId");
                if (!phone.isEmpty() && !message.isEmpty()) {
                    sendSimSms(phone, message, requestId);
                }
            } else if ("PAYMENT_CONFIRMED".equals(action)) {
                JSONObject payload = root.optJSONObject("payload");
                if (payload != null) {
                    JSONObject order = payload.optJSONObject("order");
                    if (order != null) {
                        String orderId = order.optString("id");
                        for (JSONObject o : ordersList) {
                            if (o.optString("id").equals(orderId)) {
                                o.put("paymentStatus", "paid");
                                break;
                            }
                        }
                        notifyDataChanged();
                    }
                }
            } else if ("CONNECTED".equals(action)) {
                sendWsMessage("{\"action\":\"GET_INITIAL_STATE\"}");
            }

        } catch (Exception e) {
            Log.e(TAG, "Error handling WS message: " + e.getMessage());
        }
    }

    private void parseFullState(JSONObject db) {
        try {
            JSONArray orders = db.optJSONArray("orders");
            if (orders != null) {
                ordersList.clear();
                for (int i = 0; i < orders.length(); i++) {
                    ordersList.add(orders.getJSONObject(i));
                }
            }

            JSONArray menu = db.optJSONArray("menu");
            if (menu != null) {
                menuList.clear();
                for (int i = 0; i < menu.length(); i++) {
                    menuList.add(menu.getJSONObject(i));
                }
            }

            JSONArray categories = db.optJSONArray("categories");
            if (categories != null) {
                categoriesList.clear();
                for (int i = 0; i < categories.length(); i++) {
                    categoriesList.add(categories.getJSONObject(i));
                }
            }

            JSONArray deals = db.optJSONArray("deals");
            if (deals != null) {
                dealsList.clear();
                for (int i = 0; i < deals.length(); i++) {
                    dealsList.add(deals.getJSONObject(i));
                }
            }

            JSONArray reviews = db.optJSONArray("reviews");
            if (reviews != null) {
                reviewsList.clear();
                for (int i = 0; i < reviews.length(); i++) {
                    reviewsList.add(reviews.getJSONObject(i));
                }
            }

            JSONArray customers = db.optJSONArray("customers");
            if (customers != null) {
                customersList.clear();
                for (int i = 0; i < customers.length(); i++) {
                    customersList.add(customers.getJSONObject(i));
                }
            }

            JSONObject storeInfo = db.optJSONObject("storeInfo");
            if (storeInfo != null) {
                storeInfoObj = storeInfo;
                JSONObject payment = storeInfo.optJSONObject("payment");
                if (payment != null && payment.has("upiId")) {
                    currentUpiId = payment.optString("upiId");
                }
            }

            JSONObject heroBanner = db.optJSONObject("heroBanner");
            if (heroBanner != null) {
                heroBannerObj = heroBanner;
            }

            notifyDataChanged();
        } catch (Exception e) {
            Log.e(TAG, "Error parsing state: " + e.getMessage());
        }
    }

    private void sendSimSms(String phone, String message, String requestId) {
        try {
            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= 31) {
                smsManager = getSystemService(SmsManager.class);
            } else {
                smsManager = SmsManager.getDefault();
            }

            smsManager.sendTextMessage(phone, null, message, null, null);
            smsSentToday++;
            Log.i(TAG, "SMS sent to " + phone + " (Count: " + smsSentToday + ")");
            addSmsLog("OTP Sent to " + phone);
            updateNotification("Active — Dispatched SMS: " + smsSentToday);

            String result = "{\"action\":\"SMS_RESULT\",\"requestId\":\"" + escapeJson(requestId)
                    + "\",\"phone\":\"" + escapeJson(phone)
                    + "\",\"success\":true}";
            sendWsMessage(result);

        } catch (Exception e) {
            Log.e(TAG, "SMS failed: " + e.getMessage());
            addSmsLog("SMS Failed (" + phone + "): " + e.getMessage());
            String result = "{\"action\":\"SMS_RESULT\",\"requestId\":\"" + escapeJson(requestId)
                    + "\",\"phone\":\"" + escapeJson(phone)
                    + "\",\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}";
            sendWsMessage(result);
        }
    }

    public static void onIncomingSms(Context context, String sender, String messageBody) {
        String logEntry = "UPI SMS from " + sender + ": " + (messageBody.length() > 35 ? messageBody.substring(0, 35) + "..." : messageBody);
        addSmsLog(logEntry);

        if (instance != null && instance.isWsConnected) {
            String json = "{\"action\":\"PAYMENT_SMS_RECEIVED\",\"sender\":\"" + escapeJson(sender)
                    + "\",\"smsText\":\"" + escapeJson(messageBody)
                    + "\",\"payload\":{\"sender\":\"" + escapeJson(sender) + "\",\"smsText\":\"" + escapeJson(messageBody) + "\"}}";
            instance.sendWsMessage(json);
        }
    }

    public static void addSmsLog(String log) {
        String time = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
        String entry = "[" + time + "] " + log;
        smsLogs.add(0, entry);
        if (smsLogs.size() > 50) {
            smsLogs.remove(smsLogs.size() - 1);
        }
        notifySmsLog(entry);
    }

    // ==========================================
    // STORE ACTION DISPATCHERS TO SERVER (DUAL-CHANNEL PERSISTENCE)
    // ==========================================

    public static void postRestAsync(String path, String jsonBody) {
        new Thread(() -> {
            String[] hosts = getHostBases();
            for (String base : hosts) {
                try {
                    URL url = new URL(base + path);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(3000);
                    conn.setReadTimeout(3000);
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    conn.setDoOutput(true);
                    OutputStream os = conn.getOutputStream();
                    os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                    os.close();
                    int code = conn.getResponseCode();
                    if (code >= 200 && code < 300) {
                        Log.i(TAG, "REST persist success: " + path + " on " + base);
                        break;
                    }
                } catch (Exception ignored) {}
            }
        }).start();
    }

    public static void deleteRestAsync(String path) {
        new Thread(() -> {
            String[] hosts = getHostBases();
            for (String base : hosts) {
                try {
                    URL url = new URL(base + path);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(3000);
                    conn.setReadTimeout(3000);
                    conn.setRequestMethod("DELETE");
                    int code = conn.getResponseCode();
                    if (code >= 200 && code < 300) {
                        Log.i(TAG, "REST delete success: " + path + " on " + base);
                        break;
                    }
                } catch (Exception ignored) {}
            }
        }).start();
    }

    public static void sendUpdateOrderStatus(String orderId, String status) {
        for (JSONObject o : ordersList) {
            if (o.optString("id").equals(orderId)) {
                try { o.put("status", status); } catch (Exception ignored) {}
                break;
            }
        }
        notifyDataChanged();

        String json = "{\"action\":\"UPDATE_ORDER_STATUS\",\"type\":\"UPDATE_ORDER_STATUS\",\"orderId\":\""
                + escapeJson(orderId) + "\",\"status\":\"" + escapeJson(status)
                + "\",\"payload\":{\"orderId\":\"" + escapeJson(orderId) + "\",\"status\":\"" + escapeJson(status) + "\"}}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        postRestAsync("/api/orders/update-status", "{\"orderId\":\"" + escapeJson(orderId) + "\",\"status\":\"" + escapeJson(status) + "\"}");
    }

    public static void sendRiderLocation(String boyId, double lat, double lng, float speed) {
        String json = "{\"action\":\"UPDATE_RIDER_LOCATION\",\"type\":\"UPDATE_RIDER_LOCATION\",\"boyId\":\""
                + escapeJson(boyId != null ? boyId : "rider") + "\",\"lat\":" + lat + ",\"lng\":" + lng + ",\"speed\":" + speed + "}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
    }

    public static void sendToggleAvailability(String itemId, boolean isAvailable) {
        for (JSONObject m : menuList) {
            if (m.optString("id").equals(itemId)) {
                try { m.put("available", isAvailable); } catch (Exception ignored) {}
                break;
            }
        }
        notifyDataChanged();

        String json = "{\"action\":\"TOGGLE_AVAILABILITY\",\"type\":\"TOGGLE_AVAILABILITY\",\"itemId\":\""
                + escapeJson(itemId) + "\",\"id\":\"" + escapeJson(itemId)
                + "\",\"isAvailable\":" + isAvailable + ",\"payload\":{\"id\":\"" + escapeJson(itemId) + "\",\"available\":" + isAvailable + "}}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        postRestAsync("/api/menu/toggle-stock", "{\"id\":\"" + escapeJson(itemId) + "\",\"available\":" + isAvailable + "}");
    }

    public static void sendAddMenuItem(JSONObject item) {
        menuList.add(0, item);
        notifyDataChanged();

        String json = "{\"action\":\"ADD_MENU_ITEM\",\"type\":\"ADD_MENU_ITEM\",\"payload\":" + item.toString() + "}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        postRestAsync("/api/menu/item", item.toString());
    }

    public static void sendUpdateMenuItem(String id, JSONObject updates) {
        for (int i = 0; i < menuList.size(); i++) {
            JSONObject m = menuList.get(i);
            if (m.optString("id").equals(id)) {
                try {
                    java.util.Iterator<String> keys = updates.keys();
                    while (keys.hasNext()) {
                        String k = keys.next();
                        m.put(k, updates.get(k));
                    }
                } catch (Exception ignored) {}
                break;
            }
        }
        notifyDataChanged();

        try {
            JSONObject payload = new JSONObject();
            payload.put("id", id);
            payload.put("updates", updates);
            String json = "{\"action\":\"UPDATE_MENU_ITEM\",\"type\":\"UPDATE_MENU_ITEM\",\"payload\":" + payload.toString() + "}";
            if (instance != null) {
                instance.sendWsMessage(json);
            }
            postRestAsync("/api/menu/item", payload.toString());
        } catch (Exception ignored) {}
    }

    public static void sendDeleteMenuItem(String id) {
        for (int i = 0; i < menuList.size(); i++) {
            if (menuList.get(i).optString("id").equals(id)) {
                menuList.remove(i);
                break;
            }
        }
        notifyDataChanged();

        String json = "{\"action\":\"DELETE_MENU_ITEM\",\"type\":\"DELETE_MENU_ITEM\",\"payload\":{\"id\":\"" + escapeJson(id) + "\"}}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        deleteRestAsync("/api/menu/item/" + id);
    }

    public static void sendAddCategory(JSONObject cat) {
        categoriesList.add(cat);
        notifyDataChanged();

        String json = "{\"action\":\"ADD_CATEGORY\",\"type\":\"ADD_CATEGORY\",\"payload\":" + cat.toString() + "}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
    }

    public static void sendDeleteCategory(String id) {
        for (int i = 0; i < categoriesList.size(); i++) {
            if (categoriesList.get(i).optString("id").equals(id)) {
                categoriesList.remove(i);
                break;
            }
        }
        notifyDataChanged();

        String json = "{\"action\":\"DELETE_CATEGORY\",\"type\":\"DELETE_CATEGORY\",\"payload\":{\"id\":\"" + escapeJson(id) + "\"}}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
    }

    public static void sendAddDeal(JSONObject deal) {
        dealsList.add(0, deal);
        notifyDataChanged();

        String json = "{\"action\":\"ADD_DEAL\",\"type\":\"ADD_DEAL\",\"payload\":" + deal.toString() + "}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        postRestAsync("/api/deals/item", deal.toString());
    }

    public static void sendDeleteDeal(String id) {
        for (int i = 0; i < dealsList.size(); i++) {
            if (dealsList.get(i).optString("id").equals(id)) {
                dealsList.remove(i);
                break;
            }
        }
        notifyDataChanged();

        String json = "{\"action\":\"DELETE_DEAL\",\"type\":\"DELETE_DEAL\",\"payload\":{\"id\":\"" + escapeJson(id) + "\"}}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        deleteRestAsync("/api/deals/item/" + id);
    }

    public static void sendUpdateDeal(JSONObject updated) {
        String dealId = updated.optString("id", "");
        for (int i = 0; i < dealsList.size(); i++) {
            if (dealsList.get(i).optString("id").equals(dealId)) {
                dealsList.set(i, updated);
                break;
            }
        }
        notifyDataChanged();

        try {
            JSONObject payload = new JSONObject();
            payload.put("id", dealId);
            payload.put("updates", updated);
            String json = "{\"action\":\"UPDATE_DEAL\",\"type\":\"UPDATE_DEAL\",\"payload\":" + payload.toString() + "}";
            if (instance != null) {
                instance.sendWsMessage(json);
            }
            JSONObject restBody = new JSONObject();
            restBody.put("id", dealId);
            restBody.put("updates", updated);
            postRestAsync("/api/deals/item", restBody.toString());
        } catch (Exception e) {
            Log.e(TAG, "sendUpdateDeal error: " + e.getMessage());
        }
    }

    public static void sendUpdateHeroBanner(JSONObject hero) {
        heroBannerObj = hero;
        notifyDataChanged();

        String json = "{\"action\":\"UPDATE_HERO_BANNER\",\"type\":\"UPDATE_HERO_BANNER\",\"payload\":" + hero.toString() + "}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        postRestAsync("/api/hero", hero.toString());
    }

    public static void sendUpdateStoreInfo(JSONObject storeInfo) {
        if (storeInfoObj == null) {
            storeInfoObj = new JSONObject();
        }
        try {
            java.util.Iterator<String> keys = storeInfo.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                storeInfoObj.put(key, storeInfo.get(key));
            }
        } catch (Exception ignored) {}
        JSONObject payment = storeInfoObj.optJSONObject("payment");
        if (payment != null && payment.has("upiId")) {
            currentUpiId = payment.optString("upiId");
        }
        notifyDataChanged();

        String json = "{\"action\":\"UPDATE_STORE_INFO\",\"type\":\"UPDATE_STORE_INFO\",\"payload\":" + storeInfo.toString() + "}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        postRestAsync("/api/store-info", storeInfo.toString());
    }

    public static void sendDeleteReview(String reviewId) {
        for (int i = 0; i < reviewsList.size(); i++) {
            if (reviewsList.get(i).optString("id").equals(reviewId)) {
                reviewsList.remove(i);
                break;
            }
        }
        notifyDataChanged();

        String json = "{\"action\":\"DELETE_REVIEW\",\"type\":\"DELETE_REVIEW\",\"payload\":{\"id\":\"" + escapeJson(reviewId) + "\"}}";
        if (instance != null) {
            instance.sendWsMessage(json);
        }
        deleteRestAsync("/api/reviews/" + reviewId);
    }

    public static void sendTestSms(Context context, String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return;
        }
        phone = phone.trim();
        try {
            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= 31) {
                smsManager = context.getSystemService(SmsManager.class);
            } else {
                smsManager = SmsManager.getDefault();
            }
            String testMsg = "Shawarma Nights Dukandar: SIM Gateway Hardware Test at " + new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
            smsManager.sendTextMessage(phone, null, testMsg, null, null);
            smsSentToday++;
            addSmsLog("Manual Test SMS sent to " + phone);
        } catch (Exception e) {
            addSmsLog("Test SMS failed: " + e.getMessage());
        }
    }

    public static void triggerRefresh() {
        if (instance != null) {
            instance.fetchInitialRestData();
            if (instance.isWsConnected) {
                instance.sendWsMessage("{\"action\":\"GET_INITIAL_STATE\"}");
            }
        }
    }

    public static String getCarrierName(Context context) {
        try {
            TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (tm != null) {
                String name = tm.getNetworkOperatorName();
                if (name != null && !name.trim().isEmpty()) return name;
                name = tm.getSimOperatorName();
                if (name != null && !name.trim().isEmpty()) return name;
            }
        } catch (Exception ignored) {}
        return "SIM 1 (Active)";
    }

    public void sendWsMessage(String text) {
        if (handler != null) {
            handler.post(() -> sendWsMessageInternal(text));
        } else {
            new Thread(() -> sendWsMessageInternal(text)).start();
        }
    }

    private synchronized void sendWsMessageInternal(String text) {
        try {
            if (outputStream == null || !isWsConnected) return;
            byte[] payload = text.getBytes(StandardCharsets.UTF_8);
            int len = payload.length;

            byte[] frame;
            int offset;
            if (len < 126) {
                frame = new byte[6 + len];
                frame[0] = (byte) 0x81;
                frame[1] = (byte) (0x80 | len);
                offset = 2;
            } else {
                frame = new byte[8 + len];
                frame[0] = (byte) 0x81;
                frame[1] = (byte) (0x80 | 126);
                frame[2] = (byte) ((len >> 8) & 0xFF);
                frame[3] = (byte) (len & 0xFF);
                offset = 4;
            }

            Random rng = new Random();
            byte[] mask = new byte[4];
            rng.nextBytes(mask);
            frame[offset] = mask[0];
            frame[offset + 1] = mask[1];
            frame[offset + 2] = mask[2];
            frame[offset + 3] = mask[3];

            for (int i = 0; i < len; i++) {
                frame[offset + 4 + i] = (byte) (payload[i] ^ mask[i % 4]);
            }

            outputStream.write(frame);
            outputStream.flush();
        } catch (Exception e) {
            Log.e(TAG, "Send error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            isWsConnected = false;
        }
    }

    private void sendWsPong(byte[] payload) {
        try {
            if (outputStream == null || !isWsConnected) return;
            int len = payload.length;
            byte[] frame = new byte[6 + len];
            frame[0] = (byte) 0x8A;
            frame[1] = (byte) (0x80 | len);

            Random rng = new Random();
            byte[] mask = new byte[4];
            rng.nextBytes(mask);
            frame[2] = mask[0];
            frame[3] = mask[1];
            frame[4] = mask[2];
            frame[5] = mask[3];

            for (int i = 0; i < len; i++) {
                frame[6 + i] = (byte) (payload[i] ^ mask[i % 4]);
            }

            synchronized (this) {
                outputStream.write(frame);
                outputStream.flush();
            }
        } catch (Exception ignored) {}
    }

    private String generateWebSocketKey() {
        byte[] bytes = new byte[16];
        new Random().nextBytes(bytes);
        return android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP);
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private void sendStateBroadcast(boolean connected) {
        Intent intent = new Intent("com.shawarma.GATEWAY_STATE");
        intent.setPackage(getPackageName());
        intent.putExtra("connected", connected);
        sendBroadcast(intent);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Shawarma Dukandar Gateway",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shawarma Nights Dukandar POS & SMS Gateway");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(String text) {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= 26) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
                .setContentTitle("Shawarma Nights • Dukandar")
                .setContentText(text)
                .setSmallIcon(R.drawable.ic_orders_line)
                .setContentIntent(pi)
                .setOngoing(true)
                .build();
    }

    private void updateNotification(String text) {
        try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.notify(1, buildNotification(text));
            }
        } catch (Exception ignored) {}
    }
}
