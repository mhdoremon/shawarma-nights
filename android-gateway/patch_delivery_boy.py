import os
import re

MAIN_ACTIVITY_PATH = r"c:\Users\HCI\OneDrive\Desktop\first projerct\shawarma_nights\android-gateway\src\com\shawarma\smsgateway\MainActivity.java"

with open(MAIN_ACTIVITY_PATH, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Imports
needed_imports = """
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import java.util.Collections;
import java.util.Comparator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
"""
if "import android.location.Location;" not in code:
    code = code.replace("import android.app.Activity;", "import android.app.Activity;" + needed_imports)

# 2. Member variables
needed_fields = """
    // Delivery Boy Native Console Container & State
    private ScrollView deliveryContainer;
    private LinearLayout deliveryContentBox;
    private String activeAuthRole = "dukandar"; // "dukandar" or "delivery_boy"
    private String deliveryAuthMode = "login"; // "login" or "register"
    private String deliveryOrderFilter = "ACTIVE"; // "ACTIVE", "DELIVERED", "ALL"
    private Location currentRiderLocation = null;
    private LocationManager locationManager = null;
    private LocationListener locationListener = null;
"""
if "private ScrollView deliveryContainer;" not in code:
    code = code.replace("private String activeApiBase = null;", "private String activeApiBase = null;\n" + needed_fields)

# 3. In buildNativeUI(): add deliveryContainer
delivery_ui_chunk = """
        // 5. Dedicated Delivery Boy Native Console Container
        deliveryContainer = new ScrollView(this);
        LinearLayout.LayoutParams deliveryParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f);
        deliveryContainer.setLayoutParams(deliveryParams);
        deliveryContainer.setVerticalScrollBarEnabled(false);
        deliveryContainer.setVisibility(View.GONE);

        deliveryContentBox = new LinearLayout(this);
        deliveryContentBox.setOrientation(LinearLayout.VERTICAL);
        deliveryContentBox.setPadding(dp(16), dp(16), dp(16), dp(24));
        deliveryContainer.addView(deliveryContentBox);

        rootLayout.addView(deliveryContainer);
"""
if "deliveryContainer = new ScrollView(this);" not in code:
    target = "rootLayout.addView(authContainer);"
    code = code.replace(target, target + "\n" + delivery_ui_chunk)

# 4. In applyThemeToPermanentViews(): update deliveryContainer background
if "if (deliveryContainer != null)" not in code:
    code = code.replace("applyWindowTheme(theme.isDark);", "if (deliveryContainer != null) deliveryContainer.setBackgroundColor(theme.colorBg);\n        applyWindowTheme(theme.isDark);")

# 5. In checkAndRequestPermissions(): add location permissions
if "ACCESS_FINE_LOCATION" not in code:
    perm_code = """        if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            needed.add(android.Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            needed.add(android.Manifest.permission.ACCESS_COARSE_LOCATION);
        }
"""
    code = code.replace("if (!needed.isEmpty()) {", perm_code + "        if (!needed.isEmpty()) {")

# 6. Lifecycle updates: onResume, onPause, onRequestPermissionsResult, onDataChanged
lifecycle_old = """    @Override
    protected void onResume() {
        super.onResume();
        SmsGatewayService.registerListener(this);
        updateStatusHeader(SmsGatewayService.isConnected(), SmsGatewayService.activeServerHost);
        boolean isLoggedIn = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getBoolean("is_admin_logged_in", false);
        if (isLoggedIn) {
            refreshActiveTab();
        } else {
            checkAuthAndDisplay();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        SmsGatewayService.unregisterListener(this);
    }

    @Override
    public void onDataChanged() {
        runOnUiThread(() -> {
            boolean isLoggedIn = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getBoolean("is_admin_logged_in", false);
            if (isLoggedIn) {
                refreshActiveTab();
            }
        });
    }"""

lifecycle_new = """    @Override
    protected void onResume() {
        super.onResume();
        SmsGatewayService.registerListener(this);
        updateStatusHeader(SmsGatewayService.isConnected(), SmsGatewayService.activeServerHost);
        initLocationTracking();
        checkAuthAndDisplay();
    }

    @Override
    protected void onPause() {
        super.onPause();
        SmsGatewayService.unregisterListener(this);
        stopLocationTracking();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQ_CODE) {
            initLocationTracking();
        }
    }

    @Override
    public void onDataChanged() {
        runOnUiThread(() -> {
            boolean isDelivery = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getBoolean("is_delivery_logged_in", false);
            boolean isAdmin = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getBoolean("is_admin_logged_in", false);
            if (isDelivery) {
                renderDeliveryConsole();
            } else if (isAdmin) {
                refreshActiveTab();
            }
        });
    }"""

if lifecycle_old in code:
    code = code.replace(lifecycle_old, lifecycle_new)
else:
    print("Warning: lifecycle_old not found verbatim, checking regex or manual match")

# 7. In createOrderCard (Dukandar Mode): add Map button and distance badge
map_btn_dukandar = """
        final GeoCoord dukandarCoords = extractCoordinates(order);
        Button mapBtn = new Button(this);
        mapBtn.setText("🧭 MAP");
        mapBtn.setTextSize(11);
        mapBtn.setTypeface(null, Typeface.BOLD);
        mapBtn.setTextColor(Color.WHITE);
        mapBtn.setBackgroundResource(R.drawable.bg_button_blue);
        mapBtn.setPadding(dp(10), dp(4), dp(10), dp(4));
        LinearLayout.LayoutParams mp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(36));
        mp.leftMargin = dp(8);
        mapBtn.setLayoutParams(mp);
        mapBtn.setOnClickListener(v -> openGoogleMapsNavigation(dukandarCoords, address));
        custRow.addView(mapBtn);
"""

if "final GeoCoord dukandarCoords = extractCoordinates(order);" not in code:
    code = code.replace("card.addView(custRow);", map_btn_dukandar + "        card.addView(custRow);")

# Add distance badge in Dukandar header if location known
dist_tv_dukandar = """
        if (dukandarCoords != null && currentRiderLocation != null) {
            float dist = calculateDistanceMeters(currentRiderLocation, dukandarCoords);
            if (dist >= 0) {
                TextView distTv = new TextView(this);
                distTv.setText("📍 " + formatDistance(dist));
                distTv.setTextSize(10);
                distTv.setTypeface(null, Typeface.BOLD);
                distTv.setTextColor(Color.parseColor("#38BDF8"));
                distTv.setBackgroundResource(theme.resPillGray);
                distTv.setPadding(dp(8), dp(3), dp(8), dp(3));
                LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                dlp.rightMargin = dp(8);
                distTv.setLayoutParams(dlp);
                header.addView(distTv, 1);
            }
        }
"""
if "float dist = calculateDistanceMeters(currentRiderLocation, dukandarCoords);" not in code:
    code = code.replace("header.addView(statusPill);", "header.addView(statusPill);\n" + dist_tv_dukandar)

# 8. Add helpers, checkAuthAndDisplay, loadAuthStatusAndRender, renderDeliveryConsole, etc.
# Find start of checkAuthAndDisplay:
idx = code.find("// DUKANDAR MASTER AUTHENTICATION SUBSYSTEM")
if idx == -1:
    idx = code.find("private void checkAuthAndDisplay()")

# Find sendJsonHttpRequest to preserve it at the bottom
idx_http = code.find("private JSONObject sendJsonHttpRequest(")
http_func = code[idx_http:]

new_auth_and_delivery_subsystem = """// ==========================================
    // DUAL-LOGIN, PROXIMITY ENGINE & ROLE ISOLATION SUBSYSTEM
    // ==========================================

    public static class GeoCoord {
        public final double lat;
        public final double lng;
        public GeoCoord(double lat, double lng) {
            this.lat = lat;
            this.lng = lng;
        }
    }

    public static class OrderWithDistance {
        public final JSONObject order;
        public final float distanceMeters;
        public final GeoCoord coords;
        public OrderWithDistance(JSONObject order, float distanceMeters, GeoCoord coords) {
            this.order = order;
            this.distanceMeters = distanceMeters;
            this.coords = coords;
        }
    }

    private GeoCoord extractCoordinates(JSONObject order) {
        if (order == null) return null;
        JSONObject gps = order.optJSONObject("orderGps");
        if (gps != null) {
            double lat = gps.optDouble("lat", 0);
            double lng = gps.optDouble("lng", 0);
            if (lat != 0 && lng != 0) return new GeoCoord(lat, lng);
        }
        String addr = order.optString("address", "");
        if (!addr.isEmpty()) {
            try {
                Pattern pMap = Pattern.compile("maps\\\\.google\\\\.com/\\\\?q=([0-9.-]+),([0-9.-]+)");
                Matcher mMap = pMap.matcher(addr);
                if (mMap.find()) {
                    return new GeoCoord(Double.parseDouble(mMap.group(1)), Double.parseDouble(mMap.group(2)));
                }
            } catch (Exception ignored) {}

            try {
                Pattern pGps = Pattern.compile("GPS:\\\\s*([0-9.-]+),\\\\s*([0-9.-]+)");
                Matcher mGps = pGps.matcher(addr);
                if (mGps.find()) {
                    return new GeoCoord(Double.parseDouble(mGps.group(1)), Double.parseDouble(mGps.group(2)));
                }
            } catch (Exception ignored) {}

            try {
                Pattern pGen = Pattern.compile("([0-9]{1,3}\\\\.[0-9]{4,})\\\\s*,\\\\s*([0-9]{1,3}\\\\.[0-9]{4,})");
                Matcher mGen = pGen.matcher(addr);
                if (mGen.find()) {
                    return new GeoCoord(Double.parseDouble(mGen.group(1)), Double.parseDouble(mGen.group(2)));
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private float calculateDistanceMeters(Location riderLoc, GeoCoord destination) {
        if (riderLoc == null || destination == null) return -1f;
        float[] results = new float[1];
        Location.distanceBetween(riderLoc.getLatitude(), riderLoc.getLongitude(), destination.lat, destination.lng, results);
        return results[0];
    }

    private String formatDistance(float meters) {
        if (meters < 0) return "Location pending";
        if (meters < 1000) {
            return Math.round(meters) + " m";
        } else {
            return String.format(Locale.ENGLISH, "%.1f km", meters / 1000f);
        }
    }

    private void openGoogleMapsNavigation(GeoCoord coords, String fallbackAddress) {
        try {
            if (coords != null) {
                Uri navUri = Uri.parse("google.navigation:q=" + coords.lat + "," + coords.lng + "&mode=d");
                Intent mapIntent = new Intent(Intent.ACTION_VIEW, navUri);
                mapIntent.setPackage("com.google.android.apps.maps");
                if (mapIntent.resolveActivity(getPackageManager()) != null) {
                    startActivity(mapIntent);
                    return;
                }
                Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://maps.google.com/?q=" + coords.lat + "," + coords.lng));
                startActivity(webIntent);
            } else if (fallbackAddress != null && !fallbackAddress.trim().isEmpty()) {
                Uri addrUri = Uri.parse("geo:0,0?q=" + Uri.encode(fallbackAddress.trim()));
                Intent mapIntent = new Intent(Intent.ACTION_VIEW, addrUri);
                startActivity(mapIntent);
            } else {
                Toast.makeText(this, "Customer address not available for navigation", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Could not open Maps: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void initLocationTracking() {
        try {
            if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                return;
            }
            if (locationManager == null) {
                locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
            }
            if (locationManager == null) return;

            Location gpsLoc = null;
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                gpsLoc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            }
            Location netLoc = null;
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                netLoc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }

            if (gpsLoc != null) {
                currentRiderLocation = gpsLoc;
            } else if (netLoc != null) {
                currentRiderLocation = netLoc;
            }

            if (locationListener == null) {
                locationListener = new LocationListener() {
                    @Override
                    public void onLocationChanged(Location location) {
                        if (location != null) {
                            currentRiderLocation = location;
                            runOnUiThread(() -> {
                                SharedPreferences p = getSharedPreferences("dukandar_prefs", MODE_PRIVATE);
                                boolean isDel = p.getBoolean("is_delivery_logged_in", false);
                                if (isDel) {
                                    String bId = p.getString("delivery_boy_id", "");
                                    SmsGatewayService.sendRiderLocation(bId, location.getLatitude(), location.getLongitude(), location.getSpeed());
                                    renderDeliveryConsole();
                                }
                            });
                        }
                    }
                    @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
                    @Override public void onProviderEnabled(String provider) {}
                    @Override public void onProviderDisabled(String provider) {}
                };
            }

            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000, 10, locationListener);
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 5000, 10, locationListener);
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "initLocationTracking error: " + e.getMessage());
        }
    }

    private void stopLocationTracking() {
        if (locationManager != null && locationListener != null) {
            try {
                locationManager.removeUpdates(locationListener);
            } catch (Exception ignored) {}
        }
    }

    private void checkAuthAndDisplay() {
        SharedPreferences prefs = getSharedPreferences("dukandar_prefs", MODE_PRIVATE);
        boolean isDeliveryLoggedIn = prefs.getBoolean("is_delivery_logged_in", false);
        boolean isAdminLoggedIn = prefs.getBoolean("is_admin_logged_in", false);

        if (isDeliveryLoggedIn) {
            // STRICT ROLE ISOLATION: DELIVERY BOY MODE
            // All Dukandar controls, 8 tabs, and top bar are completely stripped & hidden!
            if (authContainer != null) authContainer.setVisibility(View.GONE);
            if (navScrollView != null) navScrollView.setVisibility(View.GONE);
            if (contentFrame != null) contentFrame.setVisibility(View.GONE);
            if (topBar != null) topBar.setVisibility(View.GONE);
            if (topBarDivider != null) topBarDivider.setVisibility(View.GONE);

            if (deliveryContainer != null) {
                deliveryContainer.setVisibility(View.VISIBLE);
                renderDeliveryConsole();
            }
        } else if (isAdminLoggedIn) {
            // DUKANDAR MASTER MODE
            if (authContainer != null) authContainer.setVisibility(View.GONE);
            if (deliveryContainer != null) deliveryContainer.setVisibility(View.GONE);
            if (navScrollView != null) navScrollView.setVisibility(View.VISIBLE);
            if (contentFrame != null) contentFrame.setVisibility(View.VISIBLE);
            if (topBar != null) topBar.setVisibility(View.VISIBLE);
            if (topBarDivider != null) topBarDivider.setVisibility(View.VISIBLE);

            String savedDukan = prefs.getString("admin_dukan_name", "Shawarma Nights");
            if (brandTitle != null) brandTitle.setText(savedDukan.toUpperCase(Locale.ENGLISH));
            refreshActiveTab();
        } else {
            // LOGGED OUT: STARTUP SCREEN DUAL LOGIN
            if (navScrollView != null) navScrollView.setVisibility(View.GONE);
            if (contentFrame != null) contentFrame.setVisibility(View.GONE);
            if (deliveryContainer != null) deliveryContainer.setVisibility(View.GONE);
            if (topBar != null) topBar.setVisibility(View.GONE);
            if (topBarDivider != null) topBarDivider.setVisibility(View.GONE);

            if (authContainer != null) {
                authContainer.setVisibility(View.VISIBLE);
                loadAuthStatusAndRender();
            }
        }
    }

    private void loadAuthStatusAndRender() {
        if (authContentBox == null) return;
        authContentBox.removeAllViews();

        // 1. Server IP Badge (Tap to change)
        TextView ipBadge = new TextView(this);
        ipBadge.setText("🌐 Server IP: " + SmsGatewayService.getConfiguredServerIp(this) + " (Tap to change)");
        ipBadge.setTextSize(12);
        ipBadge.setTypeface(null, Typeface.BOLD);
        ipBadge.setTextColor(theme.colorTextSecondary);
        ipBadge.setBackgroundResource(theme.resPillGray);
        ipBadge.setGravity(Gravity.CENTER);
        ipBadge.setPadding(dp(14), dp(10), dp(14), dp(10));
        LinearLayout.LayoutParams ipParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        ipParams.bottomMargin = dp(14);
        ipBadge.setLayoutParams(ipParams);
        ipBadge.setOnClickListener(v -> showServerConfigDialog());
        authContentBox.addView(ipBadge);

        // 2. DUAL-LOGIN SWITCHER SEGMENTED TABS
        LinearLayout roleSwitcher = new LinearLayout(this);
        roleSwitcher.setOrientation(LinearLayout.HORIZONTAL);
        roleSwitcher.setPadding(0, 0, 0, dp(16));

        Button dukanTabBtn = new Button(this);
        dukanTabBtn.setText("👨‍🍳 DUKANDAR PORTAL");
        dukanTabBtn.setTextSize(12);
        dukanTabBtn.setTypeface(null, Typeface.BOLD);
        LinearLayout.LayoutParams dtp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        dtp.rightMargin = dp(6);
        dukanTabBtn.setLayoutParams(dtp);

        Button deliveryTabBtn = new Button(this);
        deliveryTabBtn.setText("🛵 DELIVERY PARTNER");
        deliveryTabBtn.setTextSize(12);
        deliveryTabBtn.setTypeface(null, Typeface.BOLD);
        LinearLayout.LayoutParams deltp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        deltp.leftMargin = dp(6);
        deliveryTabBtn.setLayoutParams(deltp);

        boolean isDukan = "dukandar".equals(activeAuthRole);
        if (isDukan) {
            dukanTabBtn.setBackgroundResource(R.drawable.bg_button_red);
            dukanTabBtn.setTextColor(Color.WHITE);
            deliveryTabBtn.setBackgroundResource(theme.resOutlineBtn);
            deliveryTabBtn.setTextColor(theme.colorTextSecondary);
        } else {
            deliveryTabBtn.setBackgroundResource(R.drawable.bg_button_red);
            deliveryTabBtn.setTextColor(Color.WHITE);
            dukanTabBtn.setBackgroundResource(theme.resOutlineBtn);
            dukanTabBtn.setTextColor(theme.colorTextSecondary);
        }

        dukanTabBtn.setOnClickListener(v -> {
            activeAuthRole = "dukandar";
            loadAuthStatusAndRender();
        });

        deliveryTabBtn.setOnClickListener(v -> {
            activeAuthRole = "delivery_boy";
            loadAuthStatusAndRender();
        });

        roleSwitcher.addView(dukanTabBtn);
        roleSwitcher.addView(deliveryTabBtn);
        authContentBox.addView(roleSwitcher);

        // 3. Render appropriate screen based on activeAuthRole
        if ("delivery_boy".equals(activeAuthRole)) {
            renderDeliveryAuthForm();
        } else {
            fetchAdminStatusAndRenderDukandar();
        }
    }

    private void renderDeliveryAuthForm() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(theme.resCardBg);
        card.setPadding(dp(20), dp(20), dp(20), dp(20));
        card.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        // Sub-switcher: [ 🔐 LOGIN ]  |  [ 📝 REGISTER NEW PARTNER ]
        LinearLayout subSwitcher = new LinearLayout(this);
        subSwitcher.setOrientation(LinearLayout.HORIZONTAL);
        subSwitcher.setPadding(0, 0, 0, dp(14));

        TextView loginSubBtn = new TextView(this);
        loginSubBtn.setText("🔐 LOGIN");
        loginSubBtn.setTextSize(12);
        loginSubBtn.setTypeface(null, Typeface.BOLD);
        loginSubBtn.setGravity(Gravity.CENTER);
        loginSubBtn.setPadding(dp(14), dp(8), dp(14), dp(8));
        LinearLayout.LayoutParams lsp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        lsp.rightMargin = dp(4);
        loginSubBtn.setLayoutParams(lsp);

        TextView regSubBtn = new TextView(this);
        regSubBtn.setText("📝 REGISTER NEW PARTNER");
        regSubBtn.setTextSize(12);
        regSubBtn.setTypeface(null, Typeface.BOLD);
        regSubBtn.setGravity(Gravity.CENTER);
        regSubBtn.setPadding(dp(14), dp(8), dp(14), dp(8));
        LinearLayout.LayoutParams rsp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        rsp.leftMargin = dp(4);
        regSubBtn.setLayoutParams(rsp);

        boolean isLogin = "login".equals(deliveryAuthMode);
        if (isLogin) {
            loginSubBtn.setBackgroundResource(R.drawable.bg_button_red);
            loginSubBtn.setTextColor(Color.WHITE);
            regSubBtn.setBackgroundResource(theme.resChipInactive);
            regSubBtn.setTextColor(theme.colorTextSecondary);
        } else {
            regSubBtn.setBackgroundResource(R.drawable.bg_button_red);
            regSubBtn.setTextColor(Color.WHITE);
            loginSubBtn.setBackgroundResource(theme.resChipInactive);
            loginSubBtn.setTextColor(theme.colorTextSecondary);
        }

        loginSubBtn.setOnClickListener(v -> {
            deliveryAuthMode = "login";
            loadAuthStatusAndRender();
        });

        regSubBtn.setOnClickListener(v -> {
            deliveryAuthMode = "register";
            loadAuthStatusAndRender();
        });

        subSwitcher.addView(loginSubBtn);
        subSwitcher.addView(regSubBtn);
        card.addView(subSwitcher);

        if ("login".equals(deliveryAuthMode)) {
            // DELIVERY BOY LOGIN
            TextView title = new TextView(this);
            title.setText("🛵 DELIVERY PARTNER LOGIN");
            title.setTextSize(15);
            title.setTypeface(null, Typeface.BOLD);
            title.setTextColor(theme.colorTextPrimary);
            card.addView(title);

            TextView sub = new TextView(this);
            sub.setText("Apna registered mobile number aur password dalein.");
            sub.setTextSize(12);
            sub.setTextColor(theme.colorTextSecondary);
            sub.setPadding(0, dp(4), 0, dp(12));
            card.addView(sub);

            EditText phoneIn = createLabeledInput(card, "REGISTERED MOBILE PHONE NUMBER", "");
            phoneIn.setInputType(InputType.TYPE_CLASS_PHONE);
            phoneIn.setHint("10-digit mobile number");

            EditText passIn = createLabeledInput(card, "PASSWORD", "");
            passIn.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            passIn.setHint("••••••••");

            TextView errView = new TextView(this);
            errView.setVisibility(View.GONE);
            errView.setTextColor(Color.parseColor("#EF4444"));
            errView.setTextSize(12);
            errView.setTypeface(null, Typeface.BOLD);
            errView.setBackgroundResource(R.drawable.bg_pill_red);
            errView.setPadding(dp(12), dp(8), dp(12), dp(8));
            LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            ep.topMargin = dp(12);
            errView.setLayoutParams(ep);
            card.addView(errView);

            Button loginBtn = new Button(this);
            loginBtn.setText("🔓 LOGIN AS DELIVERY PARTNER");
            loginBtn.setTextSize(13);
            loginBtn.setTypeface(null, Typeface.BOLD);
            loginBtn.setTextColor(Color.WHITE);
            loginBtn.setBackgroundResource(R.drawable.bg_button_red);
            loginBtn.setPadding(0, dp(14), 0, dp(14));
            LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            bp.topMargin = dp(16);
            loginBtn.setLayoutParams(bp);

            loginBtn.setOnClickListener(v -> {
                String phone = phoneIn.getText().toString().trim();
                String pwd = passIn.getText().toString();

                if (phone.isEmpty() || pwd.isEmpty()) {
                    errView.setText("⚠️ Mobile number aur password dono dalein!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }

                errView.setVisibility(View.GONE);
                loginBtn.setEnabled(false);
                loginBtn.setText("LOGGING IN...");

                new Thread(() -> {
                    try {
                        JSONObject payload = new JSONObject();
                        payload.put("phone", phone);
                        payload.put("password", pwd);

                        String base = activeApiBase != null ? activeApiBase : ("http://" + SmsGatewayService.getConfiguredServerIp(this) + ":5001");
                        JSONObject resp = sendJsonHttpRequest(base + "/api/delivery/login", "POST", payload);

                        JSONObject boy = resp.optJSONObject("boy");
                        String bId = boy != null ? boy.optString("id", "db-1") : "db-1";
                        String bName = boy != null ? boy.optString("name", "Rider") : "Rider";
                        String bPhone = boy != null ? boy.optString("phone", phone) : phone;
                        String bVehicle = boy != null ? boy.optString("vehicle", "Two-Wheeler") : "Two-Wheeler";
                        String token = resp.optString("token", "");

                        runOnUiThread(() -> {
                            getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit()
                                    .putBoolean("is_delivery_logged_in", true)
                                    .putBoolean("is_admin_logged_in", false)
                                    .putString("user_role", "delivery_boy")
                                    .putString("delivery_boy_id", bId)
                                    .putString("delivery_boy_name", bName)
                                    .putString("delivery_boy_phone", bPhone)
                                    .putString("delivery_boy_vehicle", bVehicle)
                                    .putString("delivery_boy_token", token)
                                    .apply();

                            Toast.makeText(this, "Welcome " + bName + "! Delivery Console ready.", Toast.LENGTH_SHORT).show();
                            checkAuthAndDisplay();
                            SmsGatewayService.triggerRefresh();
                        });
                    } catch (Exception e) {
                        runOnUiThread(() -> {
                            loginBtn.setEnabled(true);
                            loginBtn.setText("🔓 LOGIN AS DELIVERY PARTNER");
                            errView.setText("❌ " + e.getMessage());
                            errView.setVisibility(View.VISIBLE);
                        });
                    }
                }).start();
            });

            card.addView(loginBtn);

        } else {
            // REGISTER NEW DELIVERY PARTNER
            TextView title = new TextView(this);
            title.setText("📝 REGISTER NEW DELIVERY PARTNER");
            title.setTextSize(15);
            title.setTypeface(null, Typeface.BOLD);
            title.setTextColor(Color.parseColor("#DC2626"));
            card.addView(title);

            TextView sub = new TextView(this);
            sub.setText("Naye delivery partner ka registration karein. Har rider ka apna account rahega.");
            sub.setTextSize(12);
            sub.setTextColor(theme.colorTextSecondary);
            sub.setPadding(0, dp(4), 0, dp(12));
            card.addView(sub);

            EditText nameIn = createLabeledInput(card, "FULL NAME", "");
            nameIn.setHint("e.g. Rahul Sharma");

            EditText phoneIn = createLabeledInput(card, "MOBILE PHONE NUMBER", "");
            phoneIn.setInputType(InputType.TYPE_CLASS_PHONE);
            phoneIn.setHint("10-digit mobile number");

            EditText vehicleIn = createLabeledInput(card, "VEHICLE TYPE & NUMBER", "");
            vehicleIn.setHint("e.g. Hero Splendor RJ-18-AB-1234");

            EditText passIn = createLabeledInput(card, "CREATE PASSWORD", "");
            passIn.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            passIn.setHint("••••••••");

            EditText confPassIn = createLabeledInput(card, "CONFIRM PASSWORD", "");
            confPassIn.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            confPassIn.setHint("••••••••");

            TextView errView = new TextView(this);
            errView.setVisibility(View.GONE);
            errView.setTextColor(Color.parseColor("#EF4444"));
            errView.setTextSize(12);
            errView.setTypeface(null, Typeface.BOLD);
            errView.setBackgroundResource(R.drawable.bg_pill_red);
            errView.setPadding(dp(12), dp(8), dp(12), dp(8));
            LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            ep.topMargin = dp(12);
            errView.setLayoutParams(ep);
            card.addView(errView);

            Button regBtn = new Button(this);
            regBtn.setText("🚀 REGISTER & START DELIVERIES");
            regBtn.setTextSize(13);
            regBtn.setTypeface(null, Typeface.BOLD);
            regBtn.setTextColor(Color.WHITE);
            regBtn.setBackgroundResource(R.drawable.bg_button_red);
            regBtn.setPadding(0, dp(14), 0, dp(14));
            LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            bp.topMargin = dp(16);
            regBtn.setLayoutParams(bp);

            regBtn.setOnClickListener(v -> {
                String name = nameIn.getText().toString().trim();
                String phone = phoneIn.getText().toString().trim();
                String vehicle = vehicleIn.getText().toString().trim();
                String pwd = passIn.getText().toString();
                String cPwd = confPassIn.getText().toString();

                if (name.isEmpty() || phone.isEmpty() || vehicle.isEmpty() || pwd.isEmpty()) {
                    errView.setText("⚠️ Sabhi fields bharna zaroori hai!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }
                if (phone.length() < 10) {
                    errView.setText("⚠️ Valid 10-digit mobile number dalein!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }
                if (!pwd.equals(cPwd)) {
                    errView.setText("⚠️ Dono passwords match nahi ho rahe!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }
                if (pwd.length() < 4) {
                    errView.setText("⚠️ Password kam se kam 4 characters ka ho!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }

                errView.setVisibility(View.GONE);
                regBtn.setEnabled(false);
                regBtn.setText("REGISTERING PARTNER...");

                new Thread(() -> {
                    try {
                        JSONObject payload = new JSONObject();
                        payload.put("name", name);
                        payload.put("phone", phone);
                        payload.put("vehicle", vehicle);
                        payload.put("password", pwd);

                        String base = activeApiBase != null ? activeApiBase : ("http://" + SmsGatewayService.getConfiguredServerIp(this) + ":5001");
                        JSONObject resp = sendJsonHttpRequest(base + "/api/delivery/register", "POST", payload);

                        JSONObject boy = resp.optJSONObject("boy");
                        String bId = boy != null ? boy.optString("id", "db-" + System.currentTimeMillis()) : ("db-" + System.currentTimeMillis());
                        String bName = boy != null ? boy.optString("name", name) : name;
                        String bPhone = boy != null ? boy.optString("phone", phone) : phone;
                        String bVehicle = boy != null ? boy.optString("vehicle", vehicle) : vehicle;
                        String token = resp.optString("token", "");

                        runOnUiThread(() -> {
                            getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit()
                                    .putBoolean("is_delivery_logged_in", true)
                                    .putBoolean("is_admin_logged_in", false)
                                    .putString("user_role", "delivery_boy")
                                    .putString("delivery_boy_id", bId)
                                    .putString("delivery_boy_name", bName)
                                    .putString("delivery_boy_phone", bPhone)
                                    .putString("delivery_boy_vehicle", bVehicle)
                                    .putString("delivery_boy_token", token)
                                    .apply();

                            Toast.makeText(this, "Registration Successful! Welcome " + bName, Toast.LENGTH_SHORT).show();
                            checkAuthAndDisplay();
                            SmsGatewayService.triggerRefresh();
                        });
                    } catch (Exception e) {
                        runOnUiThread(() -> {
                            regBtn.setEnabled(true);
                            regBtn.setText("🚀 REGISTER & START DELIVERIES");
                            errView.setText("❌ " + e.getMessage());
                            errView.setVisibility(View.VISIBLE);
                        });
                    }
                }).start();
            });

            card.addView(regBtn);
        }

        authContentBox.addView(card);
    }

    private void fetchAdminStatusAndRenderDukandar() {
        TextView loading = new TextView(this);
        loading.setText("⏳ Connecting to Server (" + SmsGatewayService.getConfiguredServerIp(this) + ")...\nMaster Account status check ho raha hai...");
        loading.setTextSize(13);
        loading.setTextColor(theme.colorTextSecondary);
        loading.setGravity(Gravity.CENTER);
        loading.setPadding(dp(20), dp(40), dp(20), dp(20));
        authContentBox.addView(loading);

        new Thread(() -> {
            String configured = SmsGatewayService.getConfiguredServerIp(this);
            List<String> basesToTry = new ArrayList<>();
            basesToTry.add("http://" + configured + ":5001");
            for (String b : SmsGatewayService.getHostBases()) {
                if (!basesToTry.contains(b)) basesToTry.add(b);
            }

            JSONObject result = null;
            String foundBase = null;
            String lastErr = null;

            for (String base : basesToTry) {
                try {
                    result = sendJsonHttpRequest(base + "/api/admin/status", "GET", null);
                    foundBase = base;
                    break;
                } catch (Exception e) {
                    lastErr = e.getMessage();
                }
            }

            final JSONObject finalResult = result;
            final String finalBase = foundBase;
            final String finalErr = lastErr;

            runOnUiThread(() -> {
                if (finalResult != null && finalBase != null) {
                    activeApiBase = finalBase;
                    boolean isRegistered = finalResult.optBoolean("isRegistered", false);
                    String dukanName = finalResult.optString("dukanName", "Shawarma Nights");
                    renderAuthForm(isRegistered, dukanName);
                } else {
                    renderAuthConnectionError(finalErr);
                }
            });
        }).start();
    }

    private void renderAuthConnectionError(String errorMsg) {
        if (authContentBox == null) return;
        // Keep IP and dual switcher at top by re-rendering
        authContentBox.removeAllViews();

        TextView ipBadge = new TextView(this);
        ipBadge.setText("🌐 Server IP: " + SmsGatewayService.getConfiguredServerIp(this) + " (Tap to change)");
        ipBadge.setTextSize(12);
        ipBadge.setTypeface(null, Typeface.BOLD);
        ipBadge.setTextColor(theme.colorTextSecondary);
        ipBadge.setBackgroundResource(theme.resPillGray);
        ipBadge.setGravity(Gravity.CENTER);
        ipBadge.setPadding(dp(14), dp(10), dp(14), dp(10));
        LinearLayout.LayoutParams ipParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        ipParams.bottomMargin = dp(14);
        ipBadge.setLayoutParams(ipParams);
        ipBadge.setOnClickListener(v -> showServerConfigDialog());
        authContentBox.addView(ipBadge);

        LinearLayout roleSwitcher = new LinearLayout(this);
        roleSwitcher.setOrientation(LinearLayout.HORIZONTAL);
        roleSwitcher.setPadding(0, 0, 0, dp(16));

        Button dukanTabBtn = new Button(this);
        dukanTabBtn.setText("👨‍🍳 DUKANDAR PORTAL");
        dukanTabBtn.setTextSize(12);
        dukanTabBtn.setTypeface(null, Typeface.BOLD);
        dukanTabBtn.setBackgroundResource(R.drawable.bg_button_red);
        dukanTabBtn.setTextColor(Color.WHITE);
        LinearLayout.LayoutParams dtp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        dtp.rightMargin = dp(6);
        dukanTabBtn.setLayoutParams(dtp);

        Button deliveryTabBtn = new Button(this);
        deliveryTabBtn.setText("🛵 DELIVERY PARTNER");
        deliveryTabBtn.setTextSize(12);
        deliveryTabBtn.setTypeface(null, Typeface.BOLD);
        deliveryTabBtn.setBackgroundResource(theme.resOutlineBtn);
        deliveryTabBtn.setTextColor(theme.colorTextSecondary);
        LinearLayout.LayoutParams deltp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        deltp.leftMargin = dp(6);
        deliveryTabBtn.setLayoutParams(deltp);

        dukanTabBtn.setOnClickListener(v -> {
            activeAuthRole = "dukandar";
            loadAuthStatusAndRender();
        });
        deliveryTabBtn.setOnClickListener(v -> {
            activeAuthRole = "delivery_boy";
            loadAuthStatusAndRender();
        });

        roleSwitcher.addView(dukanTabBtn);
        roleSwitcher.addView(deliveryTabBtn);
        authContentBox.addView(roleSwitcher);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(theme.resCardBg);
        card.setPadding(dp(20), dp(20), dp(20), dp(20));
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        card.setLayoutParams(cp);

        TextView errHead = new TextView(this);
        errHead.setText("⚠️ SERVER SE CONNECTION NAHI MIL RAHA");
        errHead.setTextSize(14);
        errHead.setTypeface(null, Typeface.BOLD);
        errHead.setTextColor(Color.parseColor("#EF4444"));
        card.addView(errHead);

        TextView errSub = new TextView(this);
        errSub.setText("Server IP " + SmsGatewayService.getConfiguredServerIp(this) + ":5001 par connect nahi ho paya.\\n\\nKripya check karein:\\n1. Server chal raha hai (node server/realtimeServer.js)\\n2. Mobile aur Computer same Wi-Fi par connected hain\\n3. Upar diye gaye Server IP ko apne computer ke IP se milayein.");
        errSub.setTextSize(12);
        errSub.setTextColor(theme.colorTextSecondary);
        errSub.setPadding(0, dp(8), 0, dp(16));
        card.addView(errSub);

        Button changeIpBtn = new Button(this);
        changeIpBtn.setText("🌐 CONFIGURE SERVER IP");
        changeIpBtn.setTextSize(13);
        changeIpBtn.setTypeface(null, Typeface.BOLD);
        changeIpBtn.setTextColor(Color.WHITE);
        changeIpBtn.setBackgroundResource(R.drawable.bg_button_red);
        changeIpBtn.setPadding(0, dp(12), 0, dp(12));
        changeIpBtn.setOnClickListener(v -> showServerConfigDialog());
        card.addView(changeIpBtn);

        Button retryBtn = new Button(this);
        retryBtn.setText("🔄 RETRY CONNECTION");
        retryBtn.setTextSize(13);
        retryBtn.setTypeface(null, Typeface.BOLD);
        retryBtn.setTextColor(theme.colorTextPrimary);
        retryBtn.setBackgroundResource(theme.resOutlineBtn);
        retryBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams rbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rbp.topMargin = dp(10);
        retryBtn.setLayoutParams(rbp);
        retryBtn.setOnClickListener(v -> loadAuthStatusAndRender());
        card.addView(retryBtn);

        authContentBox.addView(card);
    }

    private void renderAuthForm(boolean isRegistered, String dukanName) {
        if (authContentBox == null) return;
        // Keep IP and dual switcher at top
        authContentBox.removeAllViews();

        TextView ipBadge = new TextView(this);
        ipBadge.setText("🌐 Server IP: " + SmsGatewayService.getConfiguredServerIp(this) + " (Tap to change)");
        ipBadge.setTextSize(12);
        ipBadge.setTypeface(null, Typeface.BOLD);
        ipBadge.setTextColor(theme.colorTextSecondary);
        ipBadge.setBackgroundResource(theme.resPillGray);
        ipBadge.setGravity(Gravity.CENTER);
        ipBadge.setPadding(dp(14), dp(10), dp(14), dp(10));
        LinearLayout.LayoutParams ipParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        ipParams.bottomMargin = dp(14);
        ipBadge.setLayoutParams(ipParams);
        ipBadge.setOnClickListener(v -> showServerConfigDialog());
        authContentBox.addView(ipBadge);

        LinearLayout roleSwitcher = new LinearLayout(this);
        roleSwitcher.setOrientation(LinearLayout.HORIZONTAL);
        roleSwitcher.setPadding(0, 0, 0, dp(16));

        Button dukanTabBtn = new Button(this);
        dukanTabBtn.setText("👨‍🍳 DUKANDAR PORTAL");
        dukanTabBtn.setTextSize(12);
        dukanTabBtn.setTypeface(null, Typeface.BOLD);
        dukanTabBtn.setBackgroundResource(R.drawable.bg_button_red);
        dukanTabBtn.setTextColor(Color.WHITE);
        LinearLayout.LayoutParams dtp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        dtp.rightMargin = dp(6);
        dukanTabBtn.setLayoutParams(dtp);

        Button deliveryTabBtn = new Button(this);
        deliveryTabBtn.setText("🛵 DELIVERY PARTNER");
        deliveryTabBtn.setTextSize(12);
        deliveryTabBtn.setTypeface(null, Typeface.BOLD);
        deliveryTabBtn.setBackgroundResource(theme.resOutlineBtn);
        deliveryTabBtn.setTextColor(theme.colorTextSecondary);
        LinearLayout.LayoutParams deltp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        deltp.leftMargin = dp(6);
        deliveryTabBtn.setLayoutParams(deltp);

        dukanTabBtn.setOnClickListener(v -> {
            activeAuthRole = "dukandar";
            loadAuthStatusAndRender();
        });
        deliveryTabBtn.setOnClickListener(v -> {
            activeAuthRole = "delivery_boy";
            loadAuthStatusAndRender();
        });

        roleSwitcher.addView(dukanTabBtn);
        roleSwitcher.addView(deliveryTabBtn);
        authContentBox.addView(roleSwitcher);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(theme.resCardBg);
        card.setPadding(dp(20), dp(20), dp(20), dp(20));
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        card.setLayoutParams(cp);

        if (!isRegistered) {
            TextView title = new TextView(this);
            title.setText("🏪 DUKAN MASTER ACCOUNT SETUP");
            title.setTextSize(15);
            title.setTypeface(null, Typeface.BOLD);
            title.setTextColor(Color.parseColor("#DC2626"));
            card.addView(title);

            TextView note = new TextView(this);
            note.setText("Dukan ka permanent master account banayein. Server par sirf 1 hi account ban sakta hai jo humesha lock rahega.");
            note.setTextSize(12);
            note.setTextColor(theme.colorTextSecondary);
            note.setPadding(0, dp(4), 0, dp(12));
            card.addView(note);

            EditText dukanIn = createLabeledInput(card, "DUKAN / RESTAURANT NAME", dukanName != null && !dukanName.isEmpty() ? dukanName : "Shawarma Nights");
            EditText userIn = createLabeledInput(card, "MASTER USERNAME / ID", "");
            userIn.setHint("e.g. admin or owner name");
            EditText phoneIn = createLabeledInput(card, "OWNER MOBILE PHONE NUMBER", "");
            phoneIn.setInputType(InputType.TYPE_CLASS_PHONE);
            phoneIn.setHint("10-digit mobile number");
            EditText passIn = createLabeledInput(card, "MASTER PASSWORD", "");
            passIn.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            passIn.setHint("••••••••");
            EditText confPassIn = createLabeledInput(card, "CONFIRM MASTER PASSWORD", "");
            confPassIn.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            confPassIn.setHint("••••••••");

            TextView errView = new TextView(this);
            errView.setVisibility(View.GONE);
            errView.setTextColor(Color.parseColor("#EF4444"));
            errView.setTextSize(12);
            errView.setTypeface(null, Typeface.BOLD);
            errView.setBackgroundResource(R.drawable.bg_pill_red);
            errView.setPadding(dp(12), dp(8), dp(12), dp(8));
            LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            ep.topMargin = dp(12);
            errView.setLayoutParams(ep);
            card.addView(errView);

            Button setupBtn = new Button(this);
            setupBtn.setText("🚀 CREATE & LOCK MASTER ACCOUNT");
            setupBtn.setTextSize(13);
            setupBtn.setTypeface(null, Typeface.BOLD);
            setupBtn.setTextColor(Color.WHITE);
            setupBtn.setBackgroundResource(R.drawable.bg_button_red);
            setupBtn.setPadding(0, dp(14), 0, dp(14));
            LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            bp.topMargin = dp(16);
            setupBtn.setLayoutParams(bp);

            setupBtn.setOnClickListener(v -> {
                String dName = dukanIn.getText().toString().trim();
                String uName = userIn.getText().toString().trim();
                String phone = phoneIn.getText().toString().trim();
                String pwd = passIn.getText().toString();
                String cPwd = confPassIn.getText().toString();

                if (dName.isEmpty() || uName.isEmpty() || phone.isEmpty() || pwd.isEmpty()) {
                    errView.setText("⚠️ Sabhi fields bharna anivarya hai!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }
                if (phone.length() < 10) {
                    errView.setText("⚠️ Kripya 10-digit mobile number dalein!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }
                if (!pwd.equals(cPwd)) {
                    errView.setText("⚠️ Dono passwords match nahi ho rahe!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }
                if (pwd.length() < 4) {
                    errView.setText("⚠️ Password kam se kam 4 characters ka ho!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }

                errView.setVisibility(View.GONE);
                setupBtn.setEnabled(false);
                setupBtn.setText("CREATING ACCOUNT & LOCKING...");

                new Thread(() -> {
                    try {
                        JSONObject payload = new JSONObject();
                        payload.put("dukanName", dName);
                        payload.put("username", uName);
                        payload.put("ownerPhone", phone);
                        payload.put("password", pwd);

                        String base = activeApiBase != null ? activeApiBase : ("http://" + SmsGatewayService.getConfiguredServerIp(this) + ":5001");
                        JSONObject resp = sendJsonHttpRequest(base + "/api/admin/setup", "POST", payload);

                        runOnUiThread(() -> {
                            getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit()
                                    .putBoolean("is_admin_logged_in", true)
                                    .putBoolean("is_delivery_logged_in", false)
                                    .putString("user_role", "dukandar")
                                    .putString("admin_username", resp.optString("username", uName))
                                    .putString("admin_dukan_name", resp.optString("dukanName", dName))
                                    .putString("admin_token", resp.optString("token", ""))
                                    .apply();

                            brandTitle.setText(dName.toUpperCase(Locale.ENGLISH));
                            Toast.makeText(this, "Master Account Created Successfully & Locked!", Toast.LENGTH_LONG).show();
                            checkAuthAndDisplay();
                            SmsGatewayService.triggerRefresh();
                        });
                    } catch (Exception e) {
                        runOnUiThread(() -> {
                            setupBtn.setEnabled(true);
                            setupBtn.setText("🚀 CREATE & LOCK MASTER ACCOUNT");
                            errView.setText("❌ " + e.getMessage());
                            errView.setVisibility(View.VISIBLE);
                        });
                    }
                }).start();
            });

            card.addView(setupBtn);

        } else {
            TextView title = new TextView(this);
            title.setText("🔐 DUKANDAR SECURE LOGIN");
            title.setTextSize(15);
            title.setTypeface(null, Typeface.BOLD);
            title.setTextColor(theme.colorTextPrimary);
            card.addView(title);

            TextView subtitle = new TextView(this);
            subtitle.setText("Master Username / Dukan ID aur Password dalein. Kisi bhi phone se login karein.");
            subtitle.setTextSize(12);
            subtitle.setTextColor(theme.colorTextSecondary);
            subtitle.setPadding(0, dp(4), 0, dp(12));
            card.addView(subtitle);

            EditText loginUserIn = createLabeledInput(card, "USERNAME / DUKAN ID / PHONE", "");
            loginUserIn.setHint("Master Username ya Mobile Number");
            EditText loginPassIn = createLabeledInput(card, "MASTER PASSWORD", "");
            loginPassIn.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            loginPassIn.setHint("••••••••");

            TextView errView = new TextView(this);
            errView.setVisibility(View.GONE);
            errView.setTextColor(Color.parseColor("#EF4444"));
            errView.setTextSize(12);
            errView.setTypeface(null, Typeface.BOLD);
            errView.setBackgroundResource(R.drawable.bg_pill_red);
            errView.setPadding(dp(12), dp(8), dp(12), dp(8));
            LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            ep.topMargin = dp(12);
            errView.setLayoutParams(ep);
            card.addView(errView);

            Button loginBtn = new Button(this);
            loginBtn.setText("🔓 SECURE LOGIN");
            loginBtn.setTextSize(13);
            loginBtn.setTypeface(null, Typeface.BOLD);
            loginBtn.setTextColor(Color.WHITE);
            loginBtn.setBackgroundResource(R.drawable.bg_button_red);
            loginBtn.setPadding(0, dp(14), 0, dp(14));
            LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            bp.topMargin = dp(16);
            loginBtn.setLayoutParams(bp);

            loginBtn.setOnClickListener(v -> {
                String uName = loginUserIn.getText().toString().trim();
                String pwd = loginPassIn.getText().toString();

                if (uName.isEmpty() || pwd.isEmpty()) {
                    errView.setText("⚠️ Username aur Password dono dalein!");
                    errView.setVisibility(View.VISIBLE);
                    return;
                }

                errView.setVisibility(View.GONE);
                loginBtn.setEnabled(false);
                loginBtn.setText("VERIFYING CREDENTIALS...");

                new Thread(() -> {
                    try {
                        JSONObject payload = new JSONObject();
                        payload.put("username", uName);
                        payload.put("password", pwd);

                        String base = activeApiBase != null ? activeApiBase : ("http://" + SmsGatewayService.getConfiguredServerIp(this) + ":5001");
                        JSONObject resp = sendJsonHttpRequest(base + "/api/admin/login", "POST", payload);

                        runOnUiThread(() -> {
                            String returnedUser = resp.optString("username", uName);
                            String returnedDukan = resp.optString("dukanName", "Shawarma Nights");
                            getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit()
                                    .putBoolean("is_admin_logged_in", true)
                                    .putBoolean("is_delivery_logged_in", false)
                                    .putString("user_role", "dukandar")
                                    .putString("admin_username", returnedUser)
                                    .putString("admin_dukan_name", returnedDukan)
                                    .putString("admin_token", resp.optString("token", ""))
                                    .apply();

                            brandTitle.setText(returnedDukan.toUpperCase(Locale.ENGLISH));
                            Toast.makeText(this, "Login Successful! Welcome " + returnedUser, Toast.LENGTH_SHORT).show();
                            checkAuthAndDisplay();
                            SmsGatewayService.triggerRefresh();
                        });
                    } catch (Exception e) {
                        runOnUiThread(() -> {
                            loginBtn.setEnabled(true);
                            loginBtn.setText("🔓 SECURE LOGIN");
                            errView.setText("❌ " + e.getMessage());
                            errView.setVisibility(View.VISIBLE);
                        });
                    }
                }).start();
            });

            card.addView(loginBtn);
        }

        authContentBox.addView(card);
    }

    // ==========================================
    // DEDICATED DELIVERY BOY NATIVE CONSOLE
    // ==========================================

    private void renderDeliveryConsole() {
        if (deliveryContentBox == null) return;
        deliveryContentBox.removeAllViews();

        SharedPreferences prefs = getSharedPreferences("dukandar_prefs", MODE_PRIVATE);
        String riderName = prefs.getString("delivery_boy_name", "Delivery Partner");
        String riderPhone = prefs.getString("delivery_boy_phone", "");
        String riderVehicle = prefs.getString("delivery_boy_vehicle", "Two-Wheeler");
        String boyId = prefs.getString("delivery_boy_id", "");

        // 1. Top Header Card
        LinearLayout headerCard = new LinearLayout(this);
        headerCard.setOrientation(LinearLayout.VERTICAL);
        headerCard.setBackgroundResource(theme.resCardBg);
        headerCard.setPadding(dp(16), dp(14), dp(16), dp(14));
        LinearLayout.LayoutParams hp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        hp.bottomMargin = dp(12);
        headerCard.setLayoutParams(hp);

        // Top Row: Brand & Controls
        LinearLayout hRow1 = new LinearLayout(this);
        hRow1.setOrientation(LinearLayout.HORIZONTAL);
        hRow1.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout brandBox = new LinearLayout(this);
        brandBox.setOrientation(LinearLayout.VERTICAL);
        brandBox.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView bTitle = new TextView(this);
        bTitle.setText("🛵 SHAWARMA EXPRESS");
        bTitle.setTextSize(15);
        bTitle.setTypeface(null, Typeface.BOLD);
        bTitle.setTextColor(Color.parseColor("#DC2626"));
        brandBox.addView(bTitle);

        TextView bSub = new TextView(this);
        bSub.setText("DELIVERY PARTNER CONSOLE");
        bSub.setTextSize(10);
        bSub.setTypeface(null, Typeface.BOLD);
        bSub.setTextColor(theme.colorTextSecondary);
        brandBox.addView(bSub);
        hRow1.addView(brandBox);

        // Online Status Pill
        TextView statusPill = new TextView(this);
        statusPill.setText(SmsGatewayService.isConnected() ? "🟢 LIVE ONLINE" : "🟡 RECONNECTING...");
        statusPill.setTextSize(10);
        statusPill.setTypeface(null, Typeface.BOLD);
        statusPill.setTextColor(Color.parseColor(SmsGatewayService.isConnected() ? "#10B981" : "#F59E0B"));
        statusPill.setBackgroundResource(SmsGatewayService.isConnected() ? R.drawable.bg_pill_green : R.drawable.bg_pill_amber);
        statusPill.setPadding(dp(8), dp(4), dp(8), dp(4));
        hRow1.addView(statusPill);

        // Theme Toggle
        ImageView themeBtn = new ImageView(this);
        themeBtn.setImageResource(R.drawable.ic_theme_line);
        themeBtn.setImageTintList(ColorStateList.valueOf(theme.colorTextSecondary));
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(dp(32), dp(32));
        tp.leftMargin = dp(6);
        themeBtn.setLayoutParams(tp);
        themeBtn.setPadding(dp(5), dp(5), dp(5), dp(5));
        themeBtn.setBackgroundResource(theme.resOutlineBtn);
        themeBtn.setOnClickListener(v -> showThemeDialog());
        hRow1.addView(themeBtn);

        // Refresh
        ImageView refBtn = new ImageView(this);
        refBtn.setImageResource(R.drawable.ic_refresh_line);
        refBtn.setImageTintList(ColorStateList.valueOf(theme.colorTextSecondary));
        LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(dp(32), dp(32));
        rp.leftMargin = dp(6);
        refBtn.setLayoutParams(rp);
        refBtn.setPadding(dp(5), dp(5), dp(5), dp(5));
        refBtn.setBackgroundResource(theme.resOutlineBtn);
        refBtn.setOnClickListener(v -> {
            Toast.makeText(this, "Orders sync ho rahe hain...", Toast.LENGTH_SHORT).show();
            SmsGatewayService.triggerRefresh();
        });
        hRow1.addView(refBtn);
        headerCard.addView(hRow1);

        // Rider Profile & Logout Row
        LinearLayout riderRow = new LinearLayout(this);
        riderRow.setOrientation(LinearLayout.HORIZONTAL);
        riderRow.setGravity(Gravity.CENTER_VERTICAL);
        riderRow.setPadding(0, dp(10), 0, 0);

        LinearLayout rInfo = new LinearLayout(this);
        rInfo.setOrientation(LinearLayout.VERTICAL);
        rInfo.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView rNameTv = new TextView(this);
        rNameTv.setText("👤 " + riderName);
        rNameTv.setTextSize(14);
        rNameTv.setTypeface(null, Typeface.BOLD);
        rNameTv.setTextColor(theme.colorTextPrimary);
        rInfo.addView(rNameTv);

        TextView rVehTv = new TextView(this);
        rVehTv.setText("🛵 " + riderVehicle + (riderPhone.isEmpty() ? "" : " • 📞 " + riderPhone));
        rVehTv.setTextSize(11);
        rVehTv.setTextColor(theme.colorTextSecondary);
        rInfo.addView(rVehTv);
        riderRow.addView(rInfo);

        Button logoutBtn = new Button(this);
        logoutBtn.setText("🚪 LOGOUT");
        logoutBtn.setTextSize(11);
        logoutBtn.setTypeface(null, Typeface.BOLD);
        logoutBtn.setTextColor(Color.parseColor("#EF4444"));
        logoutBtn.setBackgroundResource(R.drawable.bg_pill_red);
        logoutBtn.setPadding(dp(12), dp(4), dp(12), dp(4));
        logoutBtn.setOnClickListener(v -> {
            createDialogBuilder()
                    .setTitle("Logout Delivery Partner?")
                    .setMessage("Kya aap delivery console se logout karna chahte hain?")
                    .setPositiveButton("Logout", (d, w) -> {
                        getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit()
                                .putBoolean("is_delivery_logged_in", false)
                                .remove("user_role")
                                .remove("delivery_boy_token")
                                .apply();
                        Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show();
                        checkAuthAndDisplay();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        });
        riderRow.addView(logoutBtn);
        headerCard.addView(riderRow);

        // Live GPS Radar Pill
        LinearLayout gpsBar = new LinearLayout(this);
        gpsBar.setOrientation(LinearLayout.HORIZONTAL);
        gpsBar.setGravity(Gravity.CENTER_VERTICAL);
        gpsBar.setBackgroundResource(theme.resPillGray);
        gpsBar.setPadding(dp(10), dp(6), dp(10), dp(6));
        LinearLayout.LayoutParams gp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        gp.topMargin = dp(10);
        gpsBar.setLayoutParams(gp);

        TextView gpsTv = new TextView(this);
        if (currentRiderLocation != null) {
            gpsTv.setText(String.format(Locale.ENGLISH, "📍 Rider GPS: %.4f, %.4f (±%dm) • Nearest-First Engine Active",
                    currentRiderLocation.getLatitude(), currentRiderLocation.getLongitude(), Math.round(currentRiderLocation.getAccuracy())));
            gpsTv.setTextColor(Color.parseColor("#10B981"));
        } else {
            gpsTv.setText("🛰️ GPS Signal Search Ho Raha Hai... (Nearest-First Engine Ready)");
            gpsTv.setTextColor(Color.parseColor("#F59E0B"));
        }
        gpsTv.setTextSize(10);
        gpsTv.setTypeface(null, Typeface.BOLD);
        gpsBar.addView(gpsTv);
        headerCard.addView(gpsBar);

        deliveryContentBox.addView(headerCard);

        // 2. Filter Tabs (ACTIVE / DELIVERED / ALL)
        List<JSONObject> allOrders = SmsGatewayService.ordersList;
        int activeCount = 0;
        int deliveredCount = 0;
        for (JSONObject o : allOrders) {
            String s = o.optString("status", "new").toLowerCase(Locale.ROOT);
            if ("preparing".equals(s) || "out_for_delivery".equals(s) || "ready".equals(s) || "out".equals(s) || "new".equals(s)) {
                activeCount++;
            } else if ("delivered".equals(s)) {
                deliveredCount++;
            }
        }

        LinearLayout filterRow = new LinearLayout(this);
        filterRow.setOrientation(LinearLayout.HORIZONTAL);
        filterRow.setPadding(0, 0, 0, dp(12));

        String[] fKeys = new String[] { "ACTIVE", "DELIVERED", "ALL" };
        String[] fLabels = new String[] { "🛵 ACTIVE (" + activeCount + ")", "✅ DELIVERED (" + deliveredCount + ")", "📋 ALL (" + allOrders.size() + ")" };

        for (int i = 0; i < fKeys.length; i++) {
            final String key = fKeys[i];
            TextView chip = new TextView(this);
            chip.setText(fLabels[i]);
            chip.setTextSize(11);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setPadding(dp(12), dp(6), dp(12), dp(6));

            boolean isSelected = deliveryOrderFilter.equals(key);
            if (isSelected) {
                chip.setBackgroundResource(R.drawable.bg_button_red);
                chip.setTextColor(Color.WHITE);
            } else {
                chip.setBackgroundResource(theme.resChipInactive);
                chip.setTextColor(theme.colorTextSecondary);
            }

            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.rightMargin = dp(8);
            chip.setLayoutParams(cp);
            chip.setOnClickListener(v -> {
                deliveryOrderFilter = key;
                renderDeliveryConsole();
            });
            filterRow.addView(chip);
        }
        deliveryContentBox.addView(filterRow);

        // 3. Filter and Sort Orders with Nearest-First Proximity Engine
        List<JSONObject> matching = new ArrayList<>();
        for (JSONObject o : allOrders) {
            String s = o.optString("status", "new").toLowerCase(Locale.ROOT);
            if ("ACTIVE".equals(deliveryOrderFilter)) {
                if ("preparing".equals(s) || "out_for_delivery".equals(s) || "ready".equals(s) || "out".equals(s) || "new".equals(s)) {
                    matching.add(o);
                }
            } else if ("DELIVERED".equals(deliveryOrderFilter)) {
                if ("delivered".equals(s)) matching.add(o);
            } else {
                matching.add(o);
            }
        }

        if (matching.isEmpty()) {
            LinearLayout emptyCard = new LinearLayout(this);
            emptyCard.setOrientation(LinearLayout.VERTICAL);
            emptyCard.setGravity(Gravity.CENTER);
            emptyCard.setBackgroundResource(theme.resCardBg);
            emptyCard.setPadding(dp(24), dp(40), dp(24), dp(40));

            TextView emptyIcon = new TextView(this);
            emptyIcon.setText("🎉");
            emptyIcon.setTextSize(36);
            emptyIcon.setGravity(Gravity.CENTER);
            emptyCard.addView(emptyIcon);

            TextView emptyTitle = new TextView(this);
            emptyTitle.setText("KOI ORDER PENDING NAHI HAI");
            emptyTitle.setTextSize(15);
            emptyTitle.setTypeface(null, Typeface.BOLD);
            emptyTitle.setTextColor(theme.colorTextPrimary);
            emptyTitle.setPadding(0, dp(8), 0, dp(4));
            emptyTitle.setGravity(Gravity.CENTER);
            emptyCard.addView(emptyTitle);

            TextView emptySub = new TextView(this);
            emptySub.setText("Sabhi orders deliver ho chuke hain ya kitchen se dispatch hone ka intezaar hai.\\nAap online hain — naya order aate hi turant yahan live update hoga!");
            emptySub.setTextSize(12);
            emptySub.setTextColor(theme.colorTextSecondary);
            emptySub.setGravity(Gravity.CENTER);
            emptyCard.addView(emptySub);

            deliveryContentBox.addView(emptyCard);
            return;
        }

        // Calculate Distance & Sort: Nearest-First
        List<OrderWithDistance> sorted = new ArrayList<>();
        for (JSONObject o : matching) {
            GeoCoord coords = extractCoordinates(o);
            float dist = calculateDistanceMeters(currentRiderLocation, coords);
            sorted.add(new OrderWithDistance(o, dist, coords));
        }

        Collections.sort(sorted, (a, b) -> {
            if (a.distanceMeters < 0 && b.distanceMeters < 0) return 0;
            if (a.distanceMeters < 0) return 1;
            if (b.distanceMeters < 0) return -1;
            return Float.compare(a.distanceMeters, b.distanceMeters);
        });

        // 4. Render Sorted Order Cards
        for (int i = 0; i < sorted.size(); i++) {
            OrderWithDistance item = sorted.get(i);
            deliveryContentBox.addView(createDeliveryOrderCard(item, i));
        }
    }

    private View createDeliveryOrderCard(OrderWithDistance item, int rank) {
        JSONObject order = item.order;
        GeoCoord coords = item.coords;
        float distance = item.distanceMeters;

        String orderId = order.optString("id", "SN-000000");
        String customerName = order.optString("customerName", "Customer");
        String customerPhone = order.optString("customerPhone", "");
        String address = order.optString("address", "Delivery Address");
        String placedAt = order.optString("placedAt", "Just now");
        String status = order.optString("status", "new").toLowerCase(Locale.ROOT);
        String paymentMethod = order.optString("paymentMethod", "COD");
        String paymentStatus = order.optString("paymentStatus", "pending");
        double total = order.optDouble("total", 0);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(theme.resCardBg);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        p.bottomMargin = dp(14);
        card.setLayoutParams(p);

        // 1. NEAREST-FIRST ROUTE PROXIMITY BADGE
        if (distance >= 0) {
            TextView proxBanner = new TextView(this);
            if (rank == 0 && ("preparing".equals(status) || "out_for_delivery".equals(status) || "ready".equals(status))) {
                proxBanner.setText("🟢 NEXT DELIVERY: " + formatDistance(distance) + " door (Sabse Pass!)");
                proxBanner.setTextColor(Color.WHITE);
                proxBanner.setBackgroundResource(R.drawable.bg_button_green);
            } else {
                proxBanner.setText("📍 " + formatDistance(distance) + " door");
                proxBanner.setTextColor(Color.parseColor("#38BDF8"));
                proxBanner.setBackgroundResource(theme.resPillGray);
            }
            proxBanner.setTextSize(11);
            proxBanner.setTypeface(null, Typeface.BOLD);
            proxBanner.setPadding(dp(10), dp(5), dp(10), dp(5));
            LinearLayout.LayoutParams bnp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            bnp.bottomMargin = dp(10);
            proxBanner.setLayoutParams(bnp);
            card.addView(proxBanner);
        }

        // 2. Header: Order ID & Status Pill
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout idBox = new LinearLayout(this);
        idBox.setOrientation(LinearLayout.VERTICAL);
        idBox.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView idTv = new TextView(this);
        idTv.setText("#" + orderId);
        idTv.setTextSize(16);
        idTv.setTypeface(null, Typeface.BOLD);
        idTv.setTextColor(theme.colorTextPrimary);
        idBox.addView(idTv);

        TextView timeTv = new TextView(this);
        timeTv.setText("Ordered at " + placedAt);
        timeTv.setTextSize(11);
        timeTv.setTextColor(theme.colorTextMuted);
        idBox.addView(timeTv);
        header.addView(idBox);

        TextView statusPill = new TextView(this);
        statusPill.setTextSize(11);
        statusPill.setTypeface(null, Typeface.BOLD);
        statusPill.setPadding(dp(10), dp(4), dp(10), dp(4));

        if ("out_for_delivery".equals(status) || "out".equals(status)) {
            statusPill.setText("🛵 OUT FOR DELIVERY");
            statusPill.setTextColor(Color.parseColor("#F59E0B"));
            statusPill.setBackgroundResource(R.drawable.bg_pill_amber);
        } else if ("preparing".equals(status) || "ready".equals(status)) {
            statusPill.setText("🟡 IN KITCHEN (READY)");
            statusPill.setTextColor(Color.parseColor("#F59E0B"));
            statusPill.setBackgroundResource(R.drawable.bg_pill_amber);
        } else if ("delivered".equals(status)) {
            statusPill.setText("✅ DELIVERED");
            statusPill.setTextColor(Color.parseColor("#10B981"));
            statusPill.setBackgroundResource(R.drawable.bg_pill_green);
        } else {
            statusPill.setText("NEW ORDER");
            statusPill.setTextColor(Color.parseColor("#EF4444"));
            statusPill.setBackgroundResource(R.drawable.bg_pill_red);
        }
        header.addView(statusPill);
        card.addView(header);

        // Divider
        View div1 = new View(this);
        div1.setBackgroundColor(theme.colorDivider);
        LinearLayout.LayoutParams dp1 = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1));
        dp1.setMargins(0, dp(10), 0, dp(10));
        div1.setLayoutParams(dp1);
        card.addView(div1);

        // 3. Customer Info Row & 1-Tap Direct Call
        LinearLayout custRow = new LinearLayout(this);
        custRow.setOrientation(LinearLayout.HORIZONTAL);
        custRow.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout custInfo = new LinearLayout(this);
        custInfo.setOrientation(LinearLayout.VERTICAL);
        custInfo.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView nameTv = new TextView(this);
        nameTv.setText("👤 " + customerName);
        nameTv.setTextSize(14);
        nameTv.setTypeface(null, Typeface.BOLD);
        nameTv.setTextColor(theme.colorTextPrimary);
        custInfo.addView(nameTv);

        TextView phoneTv = new TextView(this);
        phoneTv.setText("📞 " + (customerPhone.isEmpty() ? "No phone" : customerPhone));
        phoneTv.setTextSize(12);
        phoneTv.setTextColor(theme.colorTextSecondary);
        custInfo.addView(phoneTv);
        custRow.addView(custInfo);

        if (!customerPhone.isEmpty()) {
            Button callBtn = new Button(this);
            callBtn.setText("📞 CALL");
            callBtn.setTextSize(11);
            callBtn.setTypeface(null, Typeface.BOLD);
            callBtn.setTextColor(Color.WHITE);
            callBtn.setBackgroundResource(R.drawable.bg_button_green);
            callBtn.setPadding(dp(12), dp(4), dp(12), dp(4));
            callBtn.setOnClickListener(v -> {
                try {
                    Intent dial = new Intent(Intent.ACTION_DIAL);
                    dial.setData(Uri.parse("tel:" + customerPhone.trim()));
                    startActivity(dial);
                } catch (Exception e) {
                    Toast.makeText(this, "Dialer error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
            custRow.addView(callBtn);
        }
        card.addView(custRow);

        // 4. Delivery Address Box
        LinearLayout addrBox = new LinearLayout(this);
        addrBox.setOrientation(LinearLayout.VERTICAL);
        addrBox.setBackgroundResource(theme.resPillGray);
        addrBox.setPadding(dp(10), dp(8), dp(10), dp(8));
        LinearLayout.LayoutParams abp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        abp.topMargin = dp(8);
        addrBox.setLayoutParams(abp);

        TextView addrTv = new TextView(this);
        addrTv.setText("🏠 " + address);
        addrTv.setTextSize(12);
        addrTv.setTextColor(theme.colorTextSecondary);
        addrBox.addView(addrTv);

        if (coords != null) {
            TextView coordsTv = new TextView(this);
            coordsTv.setText(String.format(Locale.ENGLISH, "🛰️ Captured GPS: %.5f, %.5f", coords.lat, coords.lng));
            coordsTv.setTextSize(11);
            coordsTv.setTypeface(null, Typeface.BOLD);
            coordsTv.setTextColor(Color.parseColor("#38BDF8"));
            coordsTv.setPadding(0, dp(4), 0, 0);
            addrBox.addView(coordsTv);
        }
        card.addView(addrBox);

        // 5. 1-TAP GOOGLE MAPS NAVIGATION BUTTON
        Button navBtn = new Button(this);
        navBtn.setText("🧭 OPEN GOOGLE MAPS NAVIGATION (DIRECTIONS)");
        navBtn.setTextSize(12);
        navBtn.setTypeface(null, Typeface.BOLD);
        navBtn.setTextColor(Color.WHITE);
        navBtn.setBackgroundResource(R.drawable.bg_button_blue);
        navBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams nbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        nbp.topMargin = dp(10);
        navBtn.setLayoutParams(nbp);
        navBtn.setOnClickListener(v -> openGoogleMapsNavigation(coords, address));
        card.addView(navBtn);

        // 6. Items Breakdown
        JSONArray items = order.optJSONArray("items");
        if (items != null && items.length() > 0) {
            LinearLayout itemsBox = new LinearLayout(this);
            itemsBox.setOrientation(LinearLayout.VERTICAL);
            itemsBox.setPadding(0, dp(10), 0, dp(6));

            TextView itmHead = new TextView(this);
            itmHead.setText("ITEMS ORDERED:");
            itmHead.setTextSize(10);
            itmHead.setTypeface(null, Typeface.BOLD);
            itmHead.setTextColor(theme.colorTextMuted);
            itemsBox.addView(itmHead);

            for (int j = 0; j < items.length(); j++) {
                JSONObject it = items.optJSONObject(j);
                if (it == null) continue;
                String iName = it.optString("name", "Dish");
                int qty = it.optInt("qty", 1);
                double price = it.optDouble("unitPrice", it.optDouble("price", 0));

                TextView itTv = new TextView(this);
                itTv.setText("• " + iName + " x" + qty + " (₹" + ((int)(qty * price)) + ")");
                itTv.setTextSize(12);
                itTv.setTextColor(theme.colorTextSecondary);
                itemsBox.addView(itTv);
            }
            card.addView(itemsBox);
        }

        // 7. PAYMENT COLLECTION BADGE
        LinearLayout payCard = new LinearLayout(this);
        payCard.setOrientation(LinearLayout.VERTICAL);
        payCard.setPadding(dp(12), dp(10), dp(12), dp(10));
        LinearLayout.LayoutParams pcp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        pcp.topMargin = dp(8);
        pcp.bottomMargin = dp(12);
        payCard.setLayoutParams(pcp);

        boolean isPaid = "paid".equalsIgnoreCase(paymentStatus) || "UPI".equalsIgnoreCase(paymentMethod);
        if (isPaid) {
            payCard.setBackgroundResource(R.drawable.bg_pill_green);

            TextView payTitle = new TextView(this);
            payTitle.setText("✅ ONLINE PAID (₹0 to Collect)");
            payTitle.setTextSize(13);
            payTitle.setTypeface(null, Typeface.BOLD);
            payTitle.setTextColor(Color.parseColor("#10B981"));
            payCard.addView(payTitle);

            TextView paySub = new TextView(this);
            paySub.setText("Customer ne UPI se online payment kar diya hai. Cash nahi lena.");
            paySub.setTextSize(11);
            paySub.setTextColor(Color.parseColor("#059669"));
            payCard.addView(paySub);
        } else {
            payCard.setBackgroundResource(R.drawable.bg_pill_amber);

            TextView payTitle = new TextView(this);
            payTitle.setText("💵 CASH ON DELIVERY: ₹" + ((int) total) + " COLLECT KAREIN!");
            payTitle.setTextSize(13);
            payTitle.setTypeface(null, Typeface.BOLD);
            payTitle.setTextColor(Color.parseColor("#D97706"));
            payCard.addView(payTitle);

            TextView paySub = new TextView(this);
            paySub.setText("Customer se ₹" + ((int) total) + " cash collect karein aur dukan par jama karein.");
            paySub.setTextSize(11);
            paySub.setTextColor(Color.parseColor("#B45309"));
            payCard.addView(paySub);
        }
        card.addView(payCard);

        // 8. 1-TAP ACTION WORKFLOW PROGRESSION BUTTON
        if ("preparing".equals(status) || "ready".equals(status) || "new".equals(status)) {
            Button pickBtn = new Button(this);
            pickBtn.setText("🛵 PICK UP & OUT FOR DELIVERY");
            pickBtn.setTextSize(13);
            pickBtn.setTypeface(null, Typeface.BOLD);
            pickBtn.setTextColor(Color.WHITE);
            pickBtn.setBackgroundResource(R.drawable.bg_button_red);
            pickBtn.setPadding(0, dp(14), 0, dp(14));
            pickBtn.setOnClickListener(v -> {
                SmsGatewayService.sendUpdateOrderStatus(orderId, "out_for_delivery");
                Toast.makeText(this, "Order #" + orderId + " Picked Up! Out for delivery.", Toast.LENGTH_SHORT).show();
            });
            card.addView(pickBtn);
        } else if ("out_for_delivery".equals(status) || "out".equals(status)) {
            Button delivBtn = new Button(this);
            delivBtn.setText("✅ MARK DELIVERED (ऑर्डर डिलीवर हो गया)");
            delivBtn.setTextSize(13);
            delivBtn.setTypeface(null, Typeface.BOLD);
            delivBtn.setTextColor(Color.WHITE);
            delivBtn.setBackgroundResource(R.drawable.bg_button_green);
            delivBtn.setPadding(0, dp(14), 0, dp(14));
            delivBtn.setOnClickListener(v -> {
                createDialogBuilder()
                        .setTitle("Order Delivery Confirmation")
                        .setMessage("Kya Order #" + orderId + " customer ko deliver ho gaya hai?" + (!isPaid ? "\\n\\n⚠️ Kripya ₹" + ((int) total) + " Cash collect zaroor karein!" : ""))
                        .setPositiveButton("Haan, Deliver Ho Gaya!", (d, w) -> {
                            SmsGatewayService.sendUpdateOrderStatus(orderId, "delivered");
                            Toast.makeText(this, "Order #" + orderId + " successfully delivered! 🎉", Toast.LENGTH_LONG).show();
                        })
                        .setNegativeButton("Cancel", null)
                        .show();
            });
            card.addView(delivBtn);
        }

        return card;
    }

    """

final_code = code[:idx] + new_auth_and_delivery_subsystem + http_func

with open(MAIN_ACTIVITY_PATH, 'w', encoding='utf-8') as f:
    f.write(final_code)

print("Patch applied successfully to MainActivity.java!")
