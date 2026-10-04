package com.churuone.otprelay;

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
import android.os.IBinder;
import android.os.Looper;
import android.telephony.SmsManager;
import android.util.Base64;
import android.util.Log;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

public class OtpRelayService extends Service {
    private static final String TAG = "OtpRelayService";
    private static final String CHANNEL_ID = "churuone_otp_relay_channel";
    private static final int NOTIF_ID = 2026;

    public interface RelayStatusListener {
        void onConnectionChanged(boolean connected, String storeId);
        void onSmsSent(String phone, String status, String time);
    }

    private static RelayStatusListener statusListener = null;
    private static boolean isWsConnected = false;
    private static String activeStoreId = "shawarma";
    public static final List<String> smsLogs = new ArrayList<>();

    private boolean isRunning = false;
    private Handler handler;
    private Socket socket;
    private OutputStream outputStream;
    private InputStream inputStream;
    private int reconnectDelay = 2000;

    public static void setStatusListener(RelayStatusListener listener) {
        statusListener = listener;
        if (statusListener != null) {
            statusListener.onConnectionChanged(isWsConnected, activeStoreId);
        }
    }

    public static boolean isConnected() {
        return isWsConnected;
    }

    public static String getConfiguredStoreId(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("otp_relay_prefs", MODE_PRIVATE);
        return prefs.getString("store_id", "shawarma");
    }

    public static void setConfiguredStoreId(Context context, String storeId) {
        activeStoreId = storeId.trim().toLowerCase();
        context.getSharedPreferences("otp_relay_prefs", MODE_PRIVATE).edit()
                .putString("store_id", activeStoreId)
                .apply();
    }

    public static int getSentCount(Context context) {
        return context.getSharedPreferences("otp_relay_prefs", MODE_PRIVATE).getInt("total_otp_sent", 0);
    }

    private static void incrementSentCount(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("otp_relay_prefs", MODE_PRIVATE);
        int current = prefs.getInt("total_otp_sent", 0);
        prefs.edit().putInt("total_otp_sent", current + 1).apply();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        activeStoreId = getConfiguredStoreId(this);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        isRunning = true;
        activeStoreId = getConfiguredStoreId(this);
        startForeground(NOTIF_ID, buildNotification("Starting OTP Relay Gateway..."));

        SharedPreferences prefs = getSharedPreferences("otp_relay_prefs", MODE_PRIVATE);
        prefs.edit().putBoolean("is_relay_running", true).apply();

        new Thread(this::connectWebSocket).start();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        isWsConnected = false;
        closeSocket();
        getSharedPreferences("otp_relay_prefs", MODE_PRIVATE).edit().putBoolean("is_relay_running", false).apply();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel chan = new NotificationChannel(
                    CHANNEL_ID,
                    "ChuruOne OTP Relay Channel",
                    NotificationManager.IMPORTANCE_LOW
            );
            chan.setDescription("Keeps SIM SMS Gateway alive to send customer OTPs");
            NotificationManager mgr = getSystemService(NotificationManager.class);
            if (mgr != null) mgr.createNotificationChannel(chan);
        }
    }

    private Notification buildNotification(String text) {
        Intent notifIntent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(
                this, 0, notifIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
                .setContentTitle("ChuruOne OTP Relay (" + activeStoreId + ")")
                .setContentText(text)
                .setSmallIcon(R.drawable.ic_sim_line)
                .setContentIntent(pi)
                .setOngoing(true)
                .build();
    }

    private void updateNotification(String text) {
        NotificationManager mgr = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (mgr != null) {
            mgr.notify(NOTIF_ID, buildNotification(text));
        }
    }

    private void connectWebSocket() {
        while (isRunning) {
            try {
                activeStoreId = getConfiguredStoreId(this);
                String wsUrl = "wss://churuone-backend.onrender.com/gateway?storeId=" + activeStoreId;
                URI uri = new URI(wsUrl);

                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 443 : uri.getPort();

                SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
                SSLSocket sslSocket = (SSLSocket) factory.createSocket(host, port);
                sslSocket.startHandshake();

                socket = sslSocket;
                outputStream = socket.getOutputStream();
                inputStream = socket.getInputStream();

                // Send RFC 6455 WebSocket Handshake
                String key = generateSecWebSocketKey();
                String path = uri.getRawPath() + (uri.getRawQuery() != null ? "?" + uri.getRawQuery() : "");

                String handshake = "GET " + path + " HTTP/1.1\r\n" +
                        "Host: " + host + "\r\n" +
                        "Upgrade: websocket\r\n" +
                        "Connection: Upgrade\r\n" +
                        "Sec-WebSocket-Key: " + key + "\r\n" +
                        "Sec-WebSocket-Version: 13\r\n" +
                        "X-Store-Id: " + activeStoreId + "\r\n" +
                        "\r\n";

                outputStream.write(handshake.getBytes(StandardCharsets.UTF_8));
                outputStream.flush();

                // Read Handshake response
                ByteArrayOutputStream headerBuf = new ByteArrayOutputStream();
                int consecutiveEnds = 0;
                while (true) {
                    int b = inputStream.read();
                    if (b == -1) throw new Exception("Handshake EOF");
                    headerBuf.write(b);
                    if (b == '\n' || b == '\r') {
                        consecutiveEnds++;
                        if (consecutiveEnds == 4) break;
                    } else {
                        consecutiveEnds = 0;
                    }
                }

                String responseHeaders = new String(headerBuf.toByteArray(), StandardCharsets.UTF_8);
                if (!responseHeaders.contains("101")) {
                    throw new Exception("Handshake rejected: " + responseHeaders);
                }

                isWsConnected = true;
                reconnectDelay = 2000;
                Log.i(TAG, "OTP Relay connected for store: " + activeStoreId);
                updateNotification("● Live Online | Store: " + activeStoreId);

                handler.post(() -> {
                    if (statusListener != null) {
                        statusListener.onConnectionChanged(true, activeStoreId);
                    }
                });

                // Request initial status / ping
                sendWsText("{\"action\":\"PING\"}");

                // Read WebSocket Frames
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

                    if (opcode == 0x01) { // Text Frame
                        String text = new String(payload, StandardCharsets.UTF_8);
                        handleIncomingMessage(text);
                    } else if (opcode == 0x08) { // Close
                        break;
                    } else if (opcode == 0x09) { // Ping
                        sendWsPong(payload);
                    }
                }

            } catch (Exception e) {
                Log.w(TAG, "Relay WS disconnected: " + e.getMessage());
            } finally {
                isWsConnected = false;
                closeSocket();
                updateNotification("Reconnecting in " + (reconnectDelay / 1000) + "s...");
                handler.post(() -> {
                    if (statusListener != null) {
                        statusListener.onConnectionChanged(false, activeStoreId);
                    }
                });
            }

            if (isRunning) {
                try {
                    Thread.sleep(reconnectDelay);
                } catch (InterruptedException ignored) {}
                reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            }
        }
    }

    private void handleIncomingMessage(String rawJson) {
        try {
            JSONObject root = new JSONObject(rawJson);
            String action = root.optString("action", root.optString("type", ""));

            if ("SEND_SMS".equals(action)) {
                String phone = root.optString("phone");
                String message = root.optString("message");
                String requestId = root.optString("requestId", "");

                if (!phone.isEmpty() && !message.isEmpty()) {
                    sendSimSms(phone, message, requestId);
                }
            } else if ("PING".equals(action)) {
                sendWsText("{\"action\":\"PONG\"}");
            }
        } catch (Exception e) {
            Log.e(TAG, "JSON parse error: " + e.getMessage());
        }
    }

    private void sendSimSms(String phone, String message, String requestId) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            ArrayList<String> parts = smsManager.divideMessage(message);
            if (parts.size() > 1) {
                smsManager.sendMultipartTextMessage(phone, null, parts, null, null);
            } else {
                smsManager.sendTextMessage(phone, null, message, null, null);
            }

            incrementSentCount(this);

            String timeStr = new SimpleDateFormat("hh:mm:ss a", Locale.ENGLISH).format(new Date());
            String logEntry = "Sent to " + phone + " at " + timeStr;
            smsLogs.add(0, logEntry);
            if (smsLogs.size() > 100) smsLogs.remove(smsLogs.size() - 1);

            handler.post(() -> {
                if (statusListener != null) {
                    statusListener.onSmsSent(phone, "SUCCESS", timeStr);
                }
            });

            // Report SMS_RESULT back to Server
            JSONObject resp = new JSONObject();
            resp.put("action", "SMS_RESULT");
            resp.put("requestId", requestId);
            resp.put("phone", phone);
            resp.put("success", true);
            sendWsText(resp.toString());

            Log.i(TAG, "OTP SMS successfully sent to " + phone);

        } catch (Exception e) {
            Log.e(TAG, "Failed to send SIM SMS to " + phone + ": " + e.getMessage());
            JSONObject resp = new JSONObject();
            try {
                resp.put("action", "SMS_RESULT");
                resp.put("requestId", requestId);
                resp.put("phone", phone);
                resp.put("success", false);
                resp.put("error", e.getMessage());
                sendWsText(resp.toString());
            } catch (Exception ignored) {}
        }
    }

    public static boolean sendManualTestSms(Context context, String phone) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            String testMsg = "ChuruOne OTP Relay Test: Aapka SIM gateway server se safalta-poorvak juda hua hai!";
            smsManager.sendTextMessage(phone, null, testMsg, null, null);
            incrementSentCount(context);

            String timeStr = new SimpleDateFormat("hh:mm:ss a", Locale.ENGLISH).format(new Date());
            smsLogs.add(0, "Test to " + phone + " at " + timeStr);
            if (statusListener != null) {
                statusListener.onSmsSent(phone, "TEST_SUCCESS", timeStr);
            }
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Manual test SMS failed: " + e.getMessage());
            return false;
        }
    }

    private synchronized void sendWsText(String text) {
        try {
            if (outputStream == null) return;
            byte[] payload = text.getBytes(StandardCharsets.UTF_8);
            byte[] mask = new byte[4];
            new SecureRandom().nextBytes(mask);

            ByteArrayOutputStream frame = new ByteArrayOutputStream();
            frame.write(0x81); // FIN + Text opcode

            int len = payload.length;
            if (len <= 125) {
                frame.write(0x80 | len);
            } else if (len <= 65535) {
                frame.write(0x80 | 126);
                frame.write((len >> 8) & 0xFF);
                frame.write(len & 0xFF);
            } else {
                frame.write(0x80 | 127);
                for (int i = 7; i >= 0; i--) {
                    frame.write((int) ((len >> (i * 8)) & 0xFF));
                }
            }

            frame.write(mask);
            for (int i = 0; i < len; i++) {
                frame.write((byte) (payload[i] ^ mask[i % 4]));
            }

            outputStream.write(frame.toByteArray());
            outputStream.flush();
        } catch (Exception e) {
            Log.w(TAG, "sendWsText error: " + e.getMessage());
        }
    }

    private synchronized void sendWsPong(byte[] pingPayload) {
        try {
            if (outputStream == null) return;
            byte[] mask = new byte[4];
            new SecureRandom().nextBytes(mask);

            ByteArrayOutputStream frame = new ByteArrayOutputStream();
            frame.write(0x8A); // FIN + Pong
            frame.write(0x80 | (pingPayload.length & 0x7F));
            frame.write(mask);
            for (int i = 0; i < pingPayload.length; i++) {
                frame.write((byte) (pingPayload[i] ^ mask[i % 4]));
            }
            outputStream.write(frame.toByteArray());
            outputStream.flush();
        } catch (Exception ignored) {}
    }

    private void closeSocket() {
        try {
            if (outputStream != null) outputStream.close();
            if (inputStream != null) inputStream.close();
            if (socket != null) socket.close();
        } catch (Exception ignored) {}
    }

    private String generateSecWebSocketKey() {
        byte[] nonce = new byte[16];
        new SecureRandom().nextBytes(nonce);
        return Base64.encodeToString(nonce, Base64.NO_WRAP);
    }
}
