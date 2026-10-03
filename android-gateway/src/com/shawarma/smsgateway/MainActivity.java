package com.shawarma.smsgateway;

import android.app.Activity;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import java.util.Collections;
import java.util.Comparator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Typeface;
import android.media.ExifInterface;
import android.net.Uri;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.text.InputFilter;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * 100% Native Dukandar Management Console & SMS Gateway.
 * Zero WebViews. 120fps hardware-accelerated UI matching website aesthetic.
 * Automatically adapts to Phone System Light/Dark Theme with manual toggle.
 * Integrates all 8 Dukandar Portal subsystems:
 * 0. Dashboard & Live KPIs
 * 1. Orders Management & Progression
 * 2. Menu Items & Categories
 * 3. Deals & Hero Banner Customizer
 * 4. Customers Database (VIP Vault)
 * 5. Customer Reviews Moderation
 * 6. SMS Gateway & Hardware SIM
 * 7. Store Settings & Brand Info
 */
public class MainActivity extends Activity implements SmsGatewayService.StateChangeListener {
    private static final int PERMISSION_REQ_CODE = 200;

    // Theme Configuration Palette
    public static class AppTheme {
        public final boolean isDark;
        public final int colorWindow;
        public final int colorBg;
        public final int colorTopBar;
        public final int colorNavRail;
        public final int colorCard;
        public final int colorTextPrimary;
        public final int colorTextSecondary;
        public final int colorTextMuted;
        public final int colorDivider;
        public final int colorInputText;
        public final int colorInputHint;
        public final int resCardBg;
        public final int resInputBg;
        public final int resPillGray;
        public final int resOutlineBtn;
        public final int resChipInactive;

        public AppTheme(boolean isDark) {
            this.isDark = isDark;
            if (isDark) {
                colorWindow = Color.parseColor("#090D16");
                colorBg = Color.parseColor("#090D16");
                colorTopBar = Color.parseColor("#0F172A");
                colorNavRail = Color.parseColor("#0B1120");
                colorCard = Color.parseColor("#1E293B");
                colorTextPrimary = Color.parseColor("#F8FAFC");
                colorTextSecondary = Color.parseColor("#94A3B8");
                colorTextMuted = Color.parseColor("#64748B");
                colorDivider = Color.parseColor("#1E293B");
                colorInputText = Color.WHITE;
                colorInputHint = Color.parseColor("#64748B");
                resCardBg = R.drawable.bg_card_dark;
                resInputBg = R.drawable.bg_edit_text;
                resPillGray = R.drawable.bg_pill_gray;
                resOutlineBtn = R.drawable.bg_button_outline;
                resChipInactive = R.drawable.bg_card_dark;
            } else {
                colorWindow = Color.parseColor("#FFFFFF");
                colorBg = Color.parseColor("#F8FAFC");
                colorTopBar = Color.parseColor("#FFFFFF");
                colorNavRail = Color.parseColor("#F1F5F9");
                colorCard = Color.parseColor("#FFFFFF");
                colorTextPrimary = Color.parseColor("#0F172A");
                colorTextSecondary = Color.parseColor("#475569");
                colorTextMuted = Color.parseColor("#94A3B8");
                colorDivider = Color.parseColor("#E2E8F0");
                colorInputText = Color.parseColor("#0F172A");
                colorInputHint = Color.parseColor("#94A3B8");
                resCardBg = R.drawable.bg_card_light;
                resInputBg = R.drawable.bg_edit_text_light;
                resPillGray = R.drawable.bg_pill_gray_light;
                resOutlineBtn = R.drawable.bg_button_outline_light;
                resChipInactive = R.drawable.bg_button_outline_light;
            }
        }
    }

    private AppTheme theme;

    // Active Tab: 0=Dashboard, 1=Orders, 2=Menu, 3=Offers, 4=Customers, 5=Reviews, 6=SMS, 7=Settings
    private int currentTab = 0;
    private String currentOrderFilter = "ALL";
    private String currentMenuCategoryFilter = "ALL";
    private String currentReviewFilter = "ALL";
    private String customerSearchQuery = "";
    private String menuSearchQuery = "";

    // UI Root views
    private LinearLayout rootLayout;
    private LinearLayout topBar;
    private View topBarDivider;
    private TextView brandTitle;
    private TextView brandSub;
    private TextView statusIndicator;
    private ImageView themeToggleBtn;
    private ImageView refreshBtn;
    private HorizontalScrollView navScrollView;
    private LinearLayout navRailContainer;
    private FrameLayout contentFrame;

    // Native Auth Screen Container & State
    private ScrollView authContainer;
    private LinearLayout authContentBox;
    private String activeApiBase = null;

    // Delivery Boy Native Console Container & State
    private ScrollView deliveryContainer;
    private LinearLayout deliveryContentBox;
    private String activeAuthRole = "dukandar"; // "dukandar" or "delivery_boy"
    private String deliveryAuthMode = "login"; // "login" or "register"
    private String deliveryOrderFilter = "ACTIVE"; // "ACTIVE", "DELIVERED", "ALL"
    private Location currentRiderLocation = null;
    private LocationManager locationManager = null;
    private LocationListener locationListener = null;


    // 8 Tab Containers
    private ScrollView[] tabScrollViews = new ScrollView[8];
    private LinearLayout[] tabContainers = new LinearLayout[8];

    // Navigation Tab Chips
    private TextView[] navChipButtons = new TextView[8];

    // Dish & Hero Photo Upload Selectors
    private static final int REQ_PICK_DISH_IMAGE = 101;
    private static final int REQ_PICK_HERO_IMAGE = 102;
    private EditText activeImageTargetInput = null;
    private ImageView activeImagePreviewView = null;

    private int dp(int val) {
        return (int) (val * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        updateCurrentTheme();
        buildNativeUI();
        setContentView(rootLayout);
        if (deliveryContainer != null) deliveryContainer.setBackgroundColor(theme.colorBg);
        applyWindowTheme(theme.isDark);

        // Start Gateway background service
        startGatewayService();

        // Check required runtime permissions
        checkAndRequestPermissions();

        // Check Dukandar Master Authentication
        checkAuthAndDisplay();
    }

    private void updateCurrentTheme() {
        boolean dark = isDarkModeActive();
        theme = new AppTheme(dark);
    }

    private boolean isDarkModeActive() {
        String pref = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getString("theme_mode", "SYSTEM");
        if ("LIGHT".equals(pref)) return false;
        if ("DARK".equals(pref)) return true;
        // Default: Follow phone's system night mode setting!
        int nightMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return nightMode == Configuration.UI_MODE_NIGHT_YES;
    }

    private void applyWindowTheme(boolean isDark) {
        if (Build.VERSION.SDK_INT >= 21) {
            getWindow().setStatusBarColor(isDark ? Color.parseColor("#090D16") : Color.parseColor("#FFFFFF"));
            getWindow().setNavigationBarColor(isDark ? Color.parseColor("#090D16") : Color.parseColor("#F8FAFC"));
        }
        if (Build.VERSION.SDK_INT >= 23) {
            View decor = getWindow().getDecorView();
            int flags = decor.getSystemUiVisibility();
            if (isDark) {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            } else {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            }
            if (Build.VERSION.SDK_INT >= 26) {
                if (isDark) {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                } else {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            }
            decor.setSystemUiVisibility(flags);
        }
    }

    private void applyThemeToPermanentViews() {
        if (rootLayout != null) rootLayout.setBackgroundColor(theme.colorBg);
        if (topBar != null) topBar.setBackgroundColor(theme.colorTopBar);
        if (topBarDivider != null) topBarDivider.setBackgroundColor(theme.colorDivider);
        if (brandTitle != null) brandTitle.setTextColor(theme.colorTextPrimary);
        if (brandSub != null) brandSub.setTextColor(theme.colorTextSecondary);
        if (themeToggleBtn != null) {
            themeToggleBtn.setImageTintList(ColorStateList.valueOf(theme.colorTextSecondary));
            themeToggleBtn.setBackgroundResource(theme.resOutlineBtn);
        }
        if (refreshBtn != null) {
            refreshBtn.setImageTintList(ColorStateList.valueOf(theme.colorTextSecondary));
            refreshBtn.setBackgroundResource(theme.resOutlineBtn);
        }
        if (navScrollView != null) navScrollView.setBackgroundColor(theme.colorNavRail);
        updateNavChipsTheme();
        if (deliveryContainer != null) deliveryContainer.setBackgroundColor(theme.colorBg);
        applyWindowTheme(theme.isDark);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        updateCurrentTheme();
        applyThemeToPermanentViews();
        refreshActiveTab();
    }

    private AlertDialog.Builder createDialogBuilder() {
        if (Build.VERSION.SDK_INT >= 21) {
            return new AlertDialog.Builder(this, theme.isDark ? android.R.style.Theme_Material_Dialog_Alert : android.R.style.Theme_Material_Light_Dialog_Alert);
        }
        return new AlertDialog.Builder(this);
    }

    private void showThemeDialog() {
        String current = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getString("theme_mode", "SYSTEM");
        int checkedItem = 0;
        if ("LIGHT".equals(current)) checkedItem = 1;
        else if ("DARK".equals(current)) checkedItem = 2;

        String[] options = new String[] {
                "System Default (Follow Phone)",
                "Light Theme (Always Light)",
                "Dark Theme (Always Dark)"
        };

        AlertDialog.Builder b = createDialogBuilder();
        b.setTitle("Appearance & Theme");
        b.setSingleChoiceItems(options, checkedItem, (dialog, which) -> {
            String selected = "SYSTEM";
            if (which == 1) selected = "LIGHT";
            else if (which == 2) selected = "DARK";

            getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit().putString("theme_mode", selected).apply();
            updateCurrentTheme();
            applyThemeToPermanentViews();
            refreshActiveTab();
            dialog.dismiss();
            Toast.makeText(this, "Theme set to: " + options[which], Toast.LENGTH_SHORT).show();
        });
        b.setNegativeButton("Cancel", null);
        b.show();
    }

    private void showServerConfigDialog() {
        AlertDialog.Builder b = createDialogBuilder();
        b.setTitle("☁️ ChuruOne Cloud Server");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(dp(20), dp(16), dp(20), dp(16));

        TextView msg = new TextView(this);
        msg.setText("Dukandar App direct ChuruOne Smart Cloud Server se connected hai.\n\n🌐 Cloud Host: churuone-backend.onrender.com\n🏪 Store ID: shawarma\n⚡ Live Status: " + (SmsGatewayService.isConnected() ? "🟢 Online Active" : "🟡 Reconnecting..."));
        msg.setTextSize(13);
        msg.setTextColor(theme.colorTextPrimary);
        msg.setPadding(0, 0, 0, dp(14));
        layout.addView(msg);

        Button reconnectBtn = new Button(this);
        reconnectBtn.setText("🔄 RECONNECT TO CLOUD");
        reconnectBtn.setTextSize(13);
        reconnectBtn.setTypeface(null, Typeface.BOLD);
        reconnectBtn.setTextColor(Color.WHITE);
        reconnectBtn.setBackgroundResource(R.drawable.bg_button_red);
        reconnectBtn.setPadding(0, dp(12), 0, dp(12));
        layout.addView(reconnectBtn);

        b.setView(layout);
        AlertDialog dlg = b.create();

        reconnectBtn.setOnClickListener(v -> {
            activeApiBase = "https://churuone-backend.onrender.com";
            Toast.makeText(this, "Connecting to Cloud Server...", Toast.LENGTH_SHORT).show();
            dlg.dismiss();
            boolean isLoggedIn = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getBoolean("is_admin_logged_in", false);
            if (!isLoggedIn) {
                loadAuthStatusAndRender();
            } else {
                SmsGatewayService.triggerRefresh();
            }
        });

        b.setNegativeButton("Close", null);
        dlg.show();
    }

    private void startGatewayService() {
        Intent serviceIntent = new Intent(this, SmsGatewayService.class);
        if (Build.VERSION.SDK_INT >= 26) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    private void checkAndRequestPermissions() {
        List<String> needed = new ArrayList<>();
        if (checkSelfPermission(android.Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            needed.add(android.Manifest.permission.SEND_SMS);
        }
        if (checkSelfPermission(android.Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            needed.add(android.Manifest.permission.RECEIVE_SMS);
        }
        if (checkSelfPermission(android.Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            needed.add(android.Manifest.permission.READ_SMS);
        }
        if (checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            needed.add(android.Manifest.permission.READ_PHONE_STATE);
        }
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                needed.add("android.permission.POST_NOTIFICATIONS");
            }
        }
        if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            needed.add(android.Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            needed.add(android.Manifest.permission.ACCESS_COARSE_LOCATION);
        }
        if (!needed.isEmpty()) {
            requestPermissions(needed.toArray(new String[0]), PERMISSION_REQ_CODE);
        }
    }

    @Override
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
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if ((requestCode == REQ_PICK_DISH_IMAGE || requestCode == REQ_PICK_HERO_IMAGE) && resultCode == RESULT_OK && data != null && data.getData() != null) {
            uploadImageToServer(data.getData());
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
    }

    @Override
    public void onConnectionStatusChanged(boolean connected, String host) {
        runOnUiThread(() -> updateStatusHeader(connected, host));
    }

    @Override
    public void onSmsLogAdded(String log) {
        runOnUiThread(() -> {
            if (currentTab == 6) {
                renderSmsTab();
            }
        });
    }

    private void updateStatusHeader(boolean connected, String host) {
        if (statusIndicator == null) return;
        if (connected) {
            statusIndicator.setText("● Connected | SIM Active");
            statusIndicator.setTextColor(Color.parseColor("#10B981"));
            statusIndicator.setBackgroundResource(R.drawable.bg_pill_green);
        } else {
            statusIndicator.setText("● Connect (Tap IP)");
            statusIndicator.setTextColor(Color.parseColor("#F59E0B"));
            statusIndicator.setBackgroundResource(R.drawable.bg_pill_amber);
        }
    }

    // ==========================================
    // UI LAYOUT CONSTRUCTION
    // ==========================================

    private void buildNativeUI() {
        rootLayout = new LinearLayout(this);
        rootLayout.setOrientation(LinearLayout.VERTICAL);
        rootLayout.setBackgroundColor(theme.colorBg);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // 1. TOP BRAND & STATUS HEADER
        topBar = buildTopBar();
        rootLayout.addView(topBar);

        topBarDivider = new View(this);
        topBarDivider.setBackgroundColor(theme.colorDivider);
        topBarDivider.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1)));
        rootLayout.addView(topBarDivider);

        // 2. HORIZONTAL 8-TAB NAVIGATION RAIL
        navScrollView = buildNavRail();
        rootLayout.addView(navScrollView);

        // 3. CONTENT FRAME
        contentFrame = new FrameLayout(this);
        LinearLayout.LayoutParams contentParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f);
        contentFrame.setLayoutParams(contentParams);

        // Initialize 8 tab scroll containers
        for (int i = 0; i < 8; i++) {
            ScrollView sv = new ScrollView(this);
            sv.setLayoutParams(new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
            sv.setVerticalScrollBarEnabled(false);
            sv.setVisibility(View.GONE);

            LinearLayout container = new LinearLayout(this);
            container.setOrientation(LinearLayout.VERTICAL);
            container.setPadding(dp(16), dp(12), dp(16), dp(24));
            sv.addView(container);

            tabScrollViews[i] = sv;
            tabContainers[i] = container;
            contentFrame.addView(sv);
        }

        rootLayout.addView(contentFrame);

        // 4. Native Auth Container (Shown when is_admin_logged_in == false)
        authContainer = new ScrollView(this);
        LinearLayout.LayoutParams authParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f);
        authContainer.setLayoutParams(authParams);
        authContainer.setVerticalScrollBarEnabled(false);
        authContainer.setVisibility(View.GONE);

        authContentBox = new LinearLayout(this);
        authContentBox.setOrientation(LinearLayout.VERTICAL);
        authContentBox.setPadding(dp(16), dp(16), dp(16), dp(24));
        authContainer.addView(authContentBox);

        rootLayout.addView(authContainer);

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


        // Switch to Dashboard by default
        switchTab(0);
    }

    private LinearLayout buildTopBar() {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackgroundColor(theme.colorTopBar);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(16), dp(12), dp(16), dp(12));

        // Brand Icon (Chef / Flame)
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ic_launcher_dukandar);
        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(dp(36), dp(36));
        logoParams.rightMargin = dp(10);
        logo.setLayoutParams(logoParams);
        bar.addView(logo);

        // Brand Title
        LinearLayout brandBox = new LinearLayout(this);
        brandBox.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams brandParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        brandBox.setLayoutParams(brandParams);

        brandTitle = new TextView(this);
        brandTitle.setText("SHAWARMA NIGHTS");
        brandTitle.setTextSize(15);
        brandTitle.setTypeface(null, Typeface.BOLD);
        brandTitle.setTextColor(theme.colorTextPrimary);
        brandBox.addView(brandTitle);

        brandSub = new TextView(this);
        brandSub.setText("DUKANDAR MANAGEMENT PORTAL");
        brandSub.setTextSize(10);
        brandSub.setTypeface(null, Typeface.BOLD);
        brandSub.setTextColor(theme.colorTextSecondary);
        brandBox.addView(brandSub);

        bar.addView(brandBox);

        // Live Status Indicator
        statusIndicator = new TextView(this);
        statusIndicator.setText("● Connecting...");
        statusIndicator.setTextSize(11);
        statusIndicator.setTypeface(null, Typeface.BOLD);
        statusIndicator.setTextColor(Color.parseColor("#F59E0B"));
        statusIndicator.setBackgroundResource(R.drawable.bg_pill_amber);
        statusIndicator.setPadding(dp(8), dp(4), dp(8), dp(4));
        statusIndicator.setOnClickListener(v -> showServerConfigDialog());
        bar.addView(statusIndicator);

        // Theme Toggle Button
        themeToggleBtn = new ImageView(this);
        themeToggleBtn.setImageResource(R.drawable.ic_theme_line);
        themeToggleBtn.setImageTintList(ColorStateList.valueOf(theme.colorTextSecondary));
        LinearLayout.LayoutParams thParams = new LinearLayout.LayoutParams(dp(34), dp(34));
        thParams.leftMargin = dp(8);
        themeToggleBtn.setLayoutParams(thParams);
        themeToggleBtn.setPadding(dp(6), dp(6), dp(6), dp(6));
        themeToggleBtn.setBackgroundResource(theme.resOutlineBtn);
        themeToggleBtn.setOnClickListener(v -> showThemeDialog());
        bar.addView(themeToggleBtn);

        // Refresh Button
        refreshBtn = new ImageView(this);
        refreshBtn.setImageResource(R.drawable.ic_refresh_line);
        refreshBtn.setImageTintList(ColorStateList.valueOf(theme.colorTextSecondary));
        LinearLayout.LayoutParams refParams = new LinearLayout.LayoutParams(dp(34), dp(34));
        refParams.leftMargin = dp(8);
        refreshBtn.setLayoutParams(refParams);
        refreshBtn.setPadding(dp(6), dp(6), dp(6), dp(6));
        refreshBtn.setBackgroundResource(theme.resOutlineBtn);
        refreshBtn.setOnClickListener(v -> {
            Toast.makeText(this, "Syncing with Cloud Server...", Toast.LENGTH_SHORT).show();
            SmsGatewayService.triggerRefresh();
        });
        bar.addView(refreshBtn);

        return bar;
    }

    private HorizontalScrollView buildNavRail() {
        HorizontalScrollView hsv = new HorizontalScrollView(this);
        hsv.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        hsv.setHorizontalScrollBarEnabled(false);
        hsv.setBackgroundColor(theme.colorNavRail);

        navRailContainer = new LinearLayout(this);
        navRailContainer.setOrientation(LinearLayout.HORIZONTAL);
        navRailContainer.setPadding(dp(12), dp(8), dp(12), dp(8));

        String[] titles = new String[] {
                "DASHBOARD",
                "ORDERS",
                "MENU",
                "OFFERS & HERO",
                "CUSTOMERS",
                "REVIEWS",
                "SMS GATEWAY",
                "SETTINGS"
        };

        for (int i = 0; i < 8; i++) {
            final int index = i;
            TextView chip = new TextView(this);
            chip.setText(titles[i]);
            chip.setTextSize(11);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setPadding(dp(12), dp(7), dp(12), dp(7));

            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.rightMargin = dp(6);
            chip.setLayoutParams(cp);
            chip.setOnClickListener(v -> switchTab(index));

            navChipButtons[i] = chip;
            navRailContainer.addView(chip);
        }

        hsv.addView(navRailContainer);
        return hsv;
    }

    private void updateNavChipsTheme() {
        for (int i = 0; i < 8; i++) {
            if (navChipButtons[i] == null) continue;
            boolean active = (i == currentTab);
            if (active) {
                navChipButtons[i].setBackgroundResource(R.drawable.bg_button_red);
                navChipButtons[i].setTextColor(Color.WHITE);
            } else {
                navChipButtons[i].setBackgroundResource(theme.resChipInactive);
                navChipButtons[i].setTextColor(theme.colorTextSecondary);
            }
        }
    }

    private void switchTab(int tabIndex) {
        currentTab = tabIndex;

        for (int i = 0; i < 8; i++) {
            boolean active = (i == tabIndex);
            tabScrollViews[i].setVisibility(active ? View.VISIBLE : View.GONE);
        }
        updateNavChipsTheme();
        refreshActiveTab();
    }

    private void refreshActiveTab() {
        switch (currentTab) {
            case 0: renderDashboardTab(); break;
            case 1: renderOrdersTab(); break;
            case 2: renderMenuTab(); break;
            case 3: renderOffersTab(); break;
            case 4: renderCustomersTab(); break;
            case 5: renderReviewsTab(); break;
            case 6: renderSmsTab(); break;
            case 7: renderSettingsTab(); break;
        }
    }

    // ==========================================
    // TAB 0: DASHBOARD & LIVE KPIS
    // ==========================================

    private void renderDashboardTab() {
        LinearLayout container = tabContainers[0];
        container.removeAllViews();

        TextView title = new TextView(this);
        title.setText("DASHBOARD OVERVIEW");
        title.setTextSize(16);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(theme.colorTextPrimary);
        container.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Live store performance & real-time order statistics");
        sub.setTextSize(12);
        sub.setTextColor(theme.colorTextSecondary);
        sub.setPadding(0, dp(2), 0, dp(14));
        container.addView(sub);

        // Compute live metrics dynamically from server collections (Zero Dummy)
        int newOrders = 0;
        int preparingOrders = 0;
        int outOrders = 0;
        int deliveredOrders = 0;
        double totalRevenue = 0;
        double deliveredRevenue = 0;

        for (JSONObject o : SmsGatewayService.ordersList) {
            String st = o.optString("status", "").toLowerCase(Locale.ROOT);
            double total = o.optDouble("total", 0);
            totalRevenue += total;

            if ("new".equals(st)) newOrders++;
            else if ("preparing".equals(st)) preparingOrders++;
            else if ("out_for_delivery".equals(st) || "ready".equals(st)) outOrders++;
            else if ("delivered".equals(st)) {
                deliveredOrders++;
                deliveredRevenue += total;
            }
        }

        int totalMenu = SmsGatewayService.menuList.size();
        int availableMenu = 0;
        for (JSONObject m : SmsGatewayService.menuList) {
            if (m.optBoolean("available", true)) availableMenu++;
        }

        String neutralColor = theme.isDark ? "#F8FAFC" : "#0F172A";

        // 2-Column KPI Cards Grid
        container.addView(createKpiRow("New Orders", String.valueOf(newOrders), "#DC2626", "Preparing", String.valueOf(preparingOrders), "#F59E0B"));
        container.addView(createKpiRow("Out For Delivery", String.valueOf(outOrders), "#2563EB", "Delivered Today", String.valueOf(deliveredOrders), "#10B981"));
        container.addView(createKpiRow("Total Revenue", "₹" + ((int) totalRevenue), neutralColor, "Delivered Sales", "₹" + ((int) deliveredRevenue), "#059669"));
        container.addView(createKpiRow("Total Dishes", String.valueOf(totalMenu), neutralColor, "In Stock Dishes", String.valueOf(availableMenu), "#0D9488"));

        // Quick Recent Orders section
        TextView recTitle = new TextView(this);
        recTitle.setText("RECENT ORDERS SNAPSHOT");
        recTitle.setTextSize(13);
        recTitle.setTypeface(null, Typeface.BOLD);
        recTitle.setTextColor(theme.colorTextSecondary);
        recTitle.setPadding(0, dp(18), 0, dp(8));
        container.addView(recTitle);

        if (SmsGatewayService.ordersList.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("No orders synced from server yet.");
            empty.setTextSize(13);
            empty.setTextColor(theme.colorTextMuted);
            empty.setPadding(0, dp(12), 0, dp(12));
            container.addView(empty);
        } else {
            int count = Math.min(SmsGatewayService.ordersList.size(), 3);
            for (int i = 0; i < count; i++) {
                container.addView(createOrderCard(SmsGatewayService.ordersList.get(i)));
            }
        }
    }

    private LinearLayout createKpiRow(String label1, String val1, String color1, String label2, String val2, String color2) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rp.bottomMargin = dp(10);
        row.setLayoutParams(rp);

        row.addView(createKpiCard(label1, val1, color1));
        row.addView(createKpiCard(label2, val2, color2));
        return row;
    }

    private View createKpiCard(String label, String value, String textColor) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(theme.resCardBg);
        card.setPadding(dp(14), dp(14), dp(14), dp(14));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        p.setMargins(dp(3), 0, dp(3), 0);
        card.setLayoutParams(p);

        TextView valTv = new TextView(this);
        valTv.setText(value);
        valTv.setTextSize(22);
        valTv.setTypeface(null, Typeface.BOLD);
        valTv.setTextColor(Color.parseColor(textColor.startsWith("#") ? textColor : (theme.isDark ? "#F8FAFC" : "#0F172A")));
        card.addView(valTv);

        TextView lblTv = new TextView(this);
        lblTv.setText(label.toUpperCase(Locale.ROOT));
        lblTv.setTextSize(10);
        lblTv.setTypeface(null, Typeface.BOLD);
        lblTv.setTextColor(theme.colorTextSecondary);
        lblTv.setPadding(0, dp(3), 0, 0);
        card.addView(lblTv);

        return card;
    }

    // ==========================================
    // TAB 1: ORDERS MANAGEMENT & PROGRESSION
    // ==========================================

    private void renderOrdersTab() {
        LinearLayout container = tabContainers[1];
        container.removeAllViews();

        // 1. Filter Chips Row
        LinearLayout filterRow = new LinearLayout(this);
        filterRow.setOrientation(LinearLayout.HORIZONTAL);
        filterRow.setPadding(0, 0, 0, dp(14));

        String[] filters = new String[] { "ALL", "NEW", "KITCHEN", "DELIVERED" };
        for (String f : filters) {
            final String filterKey = f;
            TextView chip = new TextView(this);
            chip.setText(f);
            chip.setTextSize(12);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setPadding(dp(14), dp(7), dp(14), dp(7));

            boolean isSelected = currentOrderFilter.equals(filterKey);
            if (isSelected) {
                chip.setBackgroundResource(R.drawable.bg_button_red);
                chip.setTextColor(Color.WHITE);
            } else {
                chip.setBackgroundResource(theme.resChipInactive);
                chip.setTextColor(theme.colorTextSecondary);
            }

            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.rightMargin = dp(8);
            chip.setLayoutParams(cp);
            chip.setOnClickListener(v -> {
                currentOrderFilter = filterKey;
                renderOrdersTab();
            });
            filterRow.addView(chip);
        }
        container.addView(filterRow);

        // Filter orders
        List<JSONObject> filtered = new ArrayList<>();
        for (JSONObject o : SmsGatewayService.ordersList) {
            String status = o.optString("status", "new").toLowerCase(Locale.ROOT);
            if ("ALL".equals(currentOrderFilter)) {
                filtered.add(o);
            } else if ("NEW".equals(currentOrderFilter) && "new".equals(status)) {
                filtered.add(o);
            } else if ("KITCHEN".equals(currentOrderFilter) && ("preparing".equals(status) || "ready".equals(status))) {
                filtered.add(o);
            } else if ("DELIVERED".equals(currentOrderFilter) && "delivered".equals(status)) {
                filtered.add(o);
            }
        }

        TextView countHeader = new TextView(this);
        countHeader.setText("ORDERS (" + filtered.size() + ")");
        countHeader.setTextSize(12);
        countHeader.setTypeface(null, Typeface.BOLD);
        countHeader.setTextColor(theme.colorTextSecondary);
        countHeader.setPadding(0, dp(4), 0, dp(10));
        container.addView(countHeader);

        if (filtered.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("No orders in " + currentOrderFilter + " queue.");
            empty.setTextSize(14);
            empty.setTextColor(theme.colorTextMuted);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(0, dp(60), 0, dp(60));
            container.addView(empty);
            return;
        }

        for (JSONObject order : filtered) {
            container.addView(createOrderCard(order));
        }
    }

    private View createOrderCard(JSONObject order) {
        String orderId = order.optString("id", "SN-000000");
        String customerName = order.optString("customerName", "Customer");
        String customerPhone = order.optString("customerPhone", "");
        String address = order.optString("address", "Delivery Address");
        String placedAt = order.optString("placedAt", "Just now");
        String status = order.optString("status", "new").toLowerCase(Locale.ROOT);
        String paymentMethod = order.optString("paymentMethod", "COD");
        String paymentStatus = order.optString("paymentStatus", "pending");
        String utr = order.optString("utr", "");
        double total = order.optDouble("total", 0);
        final GeoCoord dukandarCoords = extractCoordinates(order);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(theme.resCardBg);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        p.bottomMargin = dp(14);
        card.setLayoutParams(p);

        // Header: Order ID & Status Pill
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
        timeTv.setText("Placed at " + placedAt);
        timeTv.setTextSize(11);
        timeTv.setTextColor(theme.colorTextMuted);
        idBox.addView(timeTv);
        header.addView(idBox);

        TextView statusPill = new TextView(this);
        statusPill.setTextSize(11);
        statusPill.setTypeface(null, Typeface.BOLD);
        statusPill.setPadding(dp(10), dp(4), dp(10), dp(4));

        if ("new".equals(status)) {
            statusPill.setText("NEW ORDER");
            statusPill.setTextColor(Color.parseColor("#EF4444"));
            statusPill.setBackgroundResource(R.drawable.bg_pill_red);
        } else if ("preparing".equals(status)) {
            statusPill.setText("IN KITCHEN");
            statusPill.setTextColor(Color.parseColor("#F59E0B"));
            statusPill.setBackgroundResource(R.drawable.bg_pill_amber);
        } else if ("out_for_delivery".equals(status) || "ready".equals(status)) {
            statusPill.setText("OUT FOR DELIVERY");
            statusPill.setTextColor(Color.parseColor("#F59E0B"));
            statusPill.setBackgroundResource(R.drawable.bg_pill_amber);
        } else {
            statusPill.setText("DELIVERED");
            statusPill.setTextColor(Color.parseColor("#10B981"));
            statusPill.setBackgroundResource(R.drawable.bg_pill_green);
        }
        header.addView(statusPill);

        String delivOtp = order.optString("deliveryOtp", "");
        if (!delivOtp.isEmpty()) {
            TextView otpHd = new TextView(this);
            otpHd.setText("🔐 OTP: " + delivOtp);
            otpHd.setTextSize(11);
            otpHd.setTypeface(null, Typeface.BOLD);
            otpHd.setTextColor(Color.parseColor("#F59E0B"));
            otpHd.setBackgroundResource(R.drawable.bg_pill_amber);
            otpHd.setPadding(dp(8), dp(3), dp(8), dp(3));
            LinearLayout.LayoutParams olp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            olp.rightMargin = dp(8);
            otpHd.setLayoutParams(olp);
            header.addView(otpHd, 1);
        }

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

        card.addView(header);

        // Divider
        View div = new View(this);
        div.setBackgroundColor(theme.colorDivider);
        LinearLayout.LayoutParams divParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1));
        divParams.setMargins(0, dp(12), 0, dp(12));
        div.setLayoutParams(divParams);
        card.addView(div);

        // Customer & Phone Row (with 1-Tap Call)
        LinearLayout custRow = new LinearLayout(this);
        custRow.setOrientation(LinearLayout.HORIZONTAL);
        custRow.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout custInfo = new LinearLayout(this);
        custInfo.setOrientation(LinearLayout.VERTICAL);
        custInfo.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView nameTv = new TextView(this);
        nameTv.setText(customerName);
        nameTv.setTextSize(14);
        nameTv.setTypeface(null, Typeface.BOLD);
        nameTv.setTextColor(theme.colorTextPrimary);
        custInfo.addView(nameTv);

        TextView addrTv = new TextView(this);
        addrTv.setText(address);
        addrTv.setTextSize(12);
        addrTv.setTextColor(theme.colorTextSecondary);
        custInfo.addView(addrTv);
        custRow.addView(custInfo);

        if (!customerPhone.isEmpty()) {
            ImageView callBtn = new ImageView(this);
            callBtn.setImageResource(R.drawable.ic_call_line);
            callBtn.setImageTintList(ColorStateList.valueOf(Color.parseColor("#10B981")));
            callBtn.setBackgroundResource(theme.resOutlineBtn);
            callBtn.setPadding(dp(8), dp(8), dp(8), dp(8));
            callBtn.setLayoutParams(new LinearLayout.LayoutParams(dp(36), dp(36)));
            callBtn.setOnClickListener(v -> {
                try {
                    Intent dial = new Intent(Intent.ACTION_DIAL);
                    dial.setData(Uri.parse("tel:" + customerPhone));
                    startActivity(dial);
                } catch (Exception ignored) {}
            });
            custRow.addView(callBtn);
        }
        
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
        card.addView(custRow);

        // Items Breakdown
        JSONArray items = order.optJSONArray("items");
        if (items != null && items.length() > 0) {
            LinearLayout itemsBox = new LinearLayout(this);
            itemsBox.setOrientation(LinearLayout.VERTICAL);
            itemsBox.setPadding(0, dp(8), 0, dp(8));

            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.optJSONObject(i);
                if (item == null) continue;
                String iName = item.optString("name", "Dish");
                int qty = item.optInt("qty", 1);
                double price = item.optDouble("unitPrice", item.optDouble("price", 0));

                TextView itmTv = new TextView(this);
                itmTv.setText("• " + iName + " x" + qty + " (₹" + ((int)(qty * price)) + ")");
                itmTv.setTextSize(12);
                itmTv.setTextColor(theme.colorTextSecondary);
                itemsBox.addView(itmTv);
            }
            card.addView(itemsBox);
        }

        // Amount & Payment Status Row
        LinearLayout payRow = new LinearLayout(this);
        payRow.setOrientation(LinearLayout.HORIZONTAL);
        payRow.setGravity(Gravity.CENTER_VERTICAL);
        payRow.setPadding(0, dp(8), 0, dp(12));

        TextView totalTv = new TextView(this);
        totalTv.setText("₹" + ((int) total));
        totalTv.setTextSize(18);
        totalTv.setTypeface(null, Typeface.BOLD);
        totalTv.setTextColor(theme.colorTextPrimary);
        totalTv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        payRow.addView(totalTv);

        TextView payBadge = new TextView(this);
        payBadge.setTextSize(10);
        payBadge.setTypeface(null, Typeface.BOLD);
        payBadge.setPadding(dp(8), dp(4), dp(8), dp(4));

        boolean isPaid = "paid".equalsIgnoreCase(paymentStatus) || "UPI".equalsIgnoreCase(paymentMethod);
        if (isPaid) {
            String badgeText = "UPI AUTO-VERIFIED";
            if (!utr.isEmpty()) badgeText += " (" + utr + ")";
            payBadge.setText(badgeText);
            payBadge.setTextColor(Color.parseColor("#10B981"));
            payBadge.setBackgroundResource(R.drawable.bg_pill_green);
        } else {
            payBadge.setText("CASH ON DELIVERY");
            payBadge.setTextColor(Color.parseColor("#F59E0B"));
            payBadge.setBackgroundResource(R.drawable.bg_pill_amber);
        }
        payRow.addView(payBadge);
        card.addView(payRow);

        // 1-Tap Workflow Progression Action Button
        Button actionBtn = new Button(this);
        actionBtn.setTextSize(13);
        actionBtn.setTypeface(null, Typeface.BOLD);
        actionBtn.setTextColor(Color.WHITE);
        actionBtn.setPadding(0, dp(12), 0, dp(12));

        if ("new".equals(status)) {
            actionBtn.setText("ACCEPT & SEND TO KITCHEN");
            actionBtn.setBackgroundResource(R.drawable.bg_button_red);
            actionBtn.setOnClickListener(v -> {
                SmsGatewayService.sendUpdateOrderStatus(orderId, "preparing");
                Toast.makeText(this, "Order #" + orderId + " in Kitchen!", Toast.LENGTH_SHORT).show();
            });
            card.addView(actionBtn);
        } else if ("preparing".equals(status)) {
            actionBtn.setText("DISPATCH — OUT FOR DELIVERY");
            actionBtn.setBackgroundResource(theme.resOutlineBtn);
            actionBtn.setTextColor(Color.parseColor(theme.isDark ? "#F59E0B" : "#D97706"));
            actionBtn.setOnClickListener(v -> {
                SmsGatewayService.sendUpdateOrderStatus(orderId, "out_for_delivery");
                Toast.makeText(this, "Order #" + orderId + " dispatched!", Toast.LENGTH_SHORT).show();
            });
            card.addView(actionBtn);
        } else if ("out_for_delivery".equals(status) || "ready".equals(status)) {
            actionBtn.setText("🔐 VERIFY OTP & DELIVER (डिलीवरी पूरी करें)");
            actionBtn.setBackgroundResource(R.drawable.bg_button_green);
            actionBtn.setOnClickListener(v -> showDeliveryOtpDialog(order, isPaid, total, orderId));
            card.addView(actionBtn);
        }

        return card;
    }

    // ==========================================
    // TAB 2: MENU & CATEGORY MANAGEMENT
    // ==========================================

    private void renderMenuTab() {
        LinearLayout container = tabContainers[2];
        container.removeAllViews();

        // Header & Add Dish Button
        LinearLayout topHeader = new LinearLayout(this);
        topHeader.setOrientation(LinearLayout.HORIZONTAL);
        topHeader.setGravity(Gravity.CENTER_VERTICAL);
        topHeader.setPadding(0, 0, 0, dp(12));

        LinearLayout headText = new LinearLayout(this);
        headText.setOrientation(LinearLayout.VERTICAL);
        headText.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView title = new TextView(this);
        title.setText("MENU & DISHES (" + SmsGatewayService.menuList.size() + ")");
        title.setTextSize(15);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(theme.colorTextPrimary);
        headText.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Add, edit, delete dishes & toggle live stock");
        sub.setTextSize(11);
        sub.setTextColor(theme.colorTextSecondary);
        headText.addView(sub);
        topHeader.addView(headText);

        Button addDishBtn = new Button(this);
        addDishBtn.setText("+ ADD DISH");
        addDishBtn.setTextSize(11);
        addDishBtn.setTypeface(null, Typeface.BOLD);
        addDishBtn.setTextColor(Color.WHITE);
        addDishBtn.setBackgroundResource(R.drawable.bg_button_red);
        addDishBtn.setPadding(dp(12), dp(6), dp(12), dp(6));
        addDishBtn.setOnClickListener(v -> showAddOrEditDishDialog(null));
        topHeader.addView(addDishBtn);
        container.addView(topHeader);

        // Search Bar
        EditText searchBar = new EditText(this);
        searchBar.setHint("Search dishes by name or category...");
        searchBar.setTextColor(theme.colorInputText);
        searchBar.setHintTextColor(theme.colorInputHint);
        searchBar.setTextSize(12);
        searchBar.setBackgroundResource(theme.resInputBg);
        searchBar.setPadding(dp(12), dp(10), dp(12), dp(10));
        searchBar.setText(menuSearchQuery);
        searchBar.addTextChangedListener(new android.text.TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                menuSearchQuery = s.toString();
            }
            public void afterTextChanged(android.text.Editable s) {
                renderFilteredMenuList(container);
            }
        });
        container.addView(searchBar);

        // Category Filter Chips
        HorizontalScrollView catScroll = new HorizontalScrollView(this);
        catScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout.LayoutParams csp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        csp.setMargins(0, dp(10), 0, dp(14));
        catScroll.setLayoutParams(csp);

        LinearLayout catRail = new LinearLayout(this);
        catRail.setOrientation(LinearLayout.HORIZONTAL);

        List<String> categories = new ArrayList<>();
        categories.add("ALL");
        for (JSONObject m : SmsGatewayService.menuList) {
            String c = m.optString("category", "General");
            if (!categories.contains(c)) categories.add(c);
        }

        for (String cat : categories) {
            TextView chip = new TextView(this);
            chip.setText(cat.toUpperCase(Locale.ROOT));
            chip.setTextSize(11);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setPadding(dp(10), dp(5), dp(10), dp(5));

            boolean sel = currentMenuCategoryFilter.equalsIgnoreCase(cat);
            if (sel) {
                chip.setBackgroundResource(R.drawable.bg_button_red);
                chip.setTextColor(Color.WHITE);
            } else {
                chip.setBackgroundResource(theme.resChipInactive);
                chip.setTextColor(theme.colorTextSecondary);
            }

            LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            p.rightMargin = dp(6);
            chip.setLayoutParams(p);
            chip.setOnClickListener(v -> {
                currentMenuCategoryFilter = cat;
                renderMenuTab();
            });
            catRail.addView(chip);
        }

        catScroll.addView(catRail);
        container.addView(catScroll);

        // Container for menu list
        LinearLayout listHolder = new LinearLayout(this);
        listHolder.setOrientation(LinearLayout.VERTICAL);
        listHolder.setTag("menu_list_holder");
        container.addView(listHolder);

        renderFilteredMenuList(container);
    }

    private void renderFilteredMenuList(LinearLayout rootContainer) {
        LinearLayout listHolder = rootContainer.findViewWithTag("menu_list_holder");
        if (listHolder == null) return;
        listHolder.removeAllViews();

        List<JSONObject> filtered = new ArrayList<>();
        String q = menuSearchQuery.toLowerCase(Locale.ROOT).trim();

        for (JSONObject item : SmsGatewayService.menuList) {
            String name = item.optString("name", "");
            String category = item.optString("category", "");

            if (!"ALL".equalsIgnoreCase(currentMenuCategoryFilter) && !currentMenuCategoryFilter.equalsIgnoreCase(category)) {
                continue;
            }
            if (!q.isEmpty() && !name.toLowerCase(Locale.ROOT).contains(q) && !category.toLowerCase(Locale.ROOT).contains(q)) {
                continue;
            }
            filtered.add(item);
        }

        if (filtered.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("No dishes found in menu.");
            empty.setTextSize(13);
            empty.setTextColor(theme.colorTextMuted);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(0, dp(40), 0, dp(40));
            listHolder.addView(empty);
            return;
        }

        for (JSONObject item : filtered) {
            listHolder.addView(createMenuItemCard(item));
        }
    }

    private void loadImageIntoView(ImageView iv, String urlStr) {
        if (iv == null) return;
        if (urlStr == null || urlStr.trim().isEmpty()) {
            iv.setImageResource(R.drawable.ic_menu_line);
            iv.setBackgroundColor(Color.parseColor("#1F2937"));
            return;
        }

        String targetUrl = urlStr.trim();
        if (targetUrl.startsWith("/uploads")) {
            String base = (activeApiBase != null && !activeApiBase.isEmpty()) ? activeApiBase : "https://churuone-backend.onrender.com";
            targetUrl = base + targetUrl;
        }

        final String finalUrl = targetUrl;
        iv.setTag(finalUrl);

        new Thread(() -> {
            try {
                URL u = new URL(finalUrl);
                HttpURLConnection conn = (HttpURLConnection) u.openConnection();
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setDoInput(true);
                conn.connect();
                InputStream is = conn.getInputStream();
                final Bitmap bmp = BitmapFactory.decodeStream(is);
                is.close();
                if (bmp != null) {
                    runOnUiThread(() -> {
                        if (finalUrl.equals(iv.getTag())) {
                            iv.setImageBitmap(bmp);
                        }
                    });
                }
            } catch (Exception ignored) {}
        }).start();
    }

    private void uploadImageToServer(Uri uri) {
        if (uri == null) return;
        Toast.makeText(this, "⏳ Photo upload ho rahi hai...", Toast.LENGTH_SHORT).show();

        new Thread(() -> {
            try {
                // 1. Preserve Camera Orientation from EXIF (portrait food photos will stay upright)
                int rotationDegrees = 0;
                try {
                    InputStream exifStream = getContentResolver().openInputStream(uri);
                    if (exifStream != null) {
                        ExifInterface exif = new ExifInterface(exifStream);
                        int orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
                        if (orientation == ExifInterface.ORIENTATION_ROTATE_90) rotationDegrees = 90;
                        else if (orientation == ExifInterface.ORIENTATION_ROTATE_180) rotationDegrees = 180;
                        else if (orientation == ExifInterface.ORIENTATION_ROTATE_270) rotationDegrees = 270;
                        exifStream.close();
                    }
                } catch (Exception ignored) {}

                // 2. Read original image dimensions
                BitmapFactory.Options opts = new BitmapFactory.Options();
                opts.inJustDecodeBounds = true;
                InputStream is1 = getContentResolver().openInputStream(uri);
                BitmapFactory.decodeStream(is1, null, opts);
                if (is1 != null) is1.close();

                int origW = opts.outWidth;
                int origH = opts.outHeight;
                if (origW <= 0 || origH <= 0) {
                    throw new Exception("Photo dimensions invalid");
                }

                // 3. Smart Downsampling: Target crisp 1280px max dimension (Full HD retina quality)
                int targetMax = 1280;
                int maxDim = Math.max(origW, origH);
                int sampleSize = 1;
                while (maxDim / (sampleSize * 2) >= targetMax) {
                    sampleSize *= 2;
                }

                opts.inJustDecodeBounds = false;
                opts.inSampleSize = sampleSize;
                InputStream is2 = getContentResolver().openInputStream(uri);
                Bitmap decodedBmp = BitmapFactory.decodeStream(is2, null, opts);
                if (is2 != null) is2.close();

                if (decodedBmp == null) {
                    throw new Exception("Photo decode nahi ho payi");
                }

                // 4. Exact bilinear scaling with aspect ratio preservation & rotation correction
                int curW = decodedBmp.getWidth();
                int curH = decodedBmp.getHeight();
                float scale = Math.min(1.0f, (float) targetMax / Math.max(curW, curH));

                Matrix matrix = new Matrix();
                if (scale < 1.0f) {
                    matrix.postScale(scale, scale);
                }
                if (rotationDegrees != 0) {
                    matrix.postRotate(rotationDegrees);
                }

                final Bitmap finalBitmap;
                if (scale < 1.0f || rotationDegrees != 0) {
                    finalBitmap = Bitmap.createBitmap(decodedBmp, 0, 0, curW, curH, matrix, true);
                    if (finalBitmap != decodedBmp) {
                        decodedBmp.recycle();
                    }
                } else {
                    finalBitmap = decodedBmp;
                }

                // 5. High-quality 90% JPEG compression (crystal clear, ~180KB - 250KB)
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                finalBitmap.compress(Bitmap.CompressFormat.JPEG, 90, baos);
                byte[] bytes = baos.toByteArray();
                String base64Data = "data:image/jpeg;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP);

                JSONObject payload = new JSONObject();
                payload.put("image", base64Data);
                payload.put("filename", "dish_" + System.currentTimeMillis() + ".jpg");

                JSONObject res = sendJsonHttpRequestWithCandidateFallback("/api/upload", "POST", payload);
                if (res != null && res.optBoolean("success", false)) {
                    final String uploadedUrl = res.optString("url", "");
                    runOnUiThread(() -> {
                        if (activeImageTargetInput != null) {
                            activeImageTargetInput.setText(uploadedUrl);
                        }
                        if (activeImagePreviewView != null) {
                            activeImagePreviewView.setImageBitmap(finalBitmap);
                        }
                        Toast.makeText(MainActivity.this, "✅ Photo Upload Ho Gayi! 📸 (HD Clear)", Toast.LENGTH_SHORT).show();
                    });
                } else {
                    String err = res != null ? res.optString("error", "Upload failed") : "Upload failed";
                    throw new Exception(err);
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "⚠️ Photo upload nahi ho saki: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    private LinearLayout createImagePickerSection(LinearLayout parent, String currentUrl, EditText targetInput, String titleLabel) {
        LinearLayout section = new LinearLayout(this);
        section.setOrientation(LinearLayout.VERTICAL);
        section.setBackgroundResource(theme.resCardBg);
        section.setPadding(dp(12), dp(12), dp(12), dp(12));
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        sp.topMargin = dp(8);
        sp.bottomMargin = dp(12);
        section.setLayoutParams(sp);

        TextView title = new TextView(this);
        title.setText(titleLabel);
        title.setTextSize(12);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(Color.parseColor("#DC2626"));
        section.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Phone gallery se upload karein ya ready food photo chunein:");
        sub.setTextSize(10);
        sub.setTextColor(theme.colorTextSecondary);
        sub.setPadding(0, dp(2), 0, dp(8));
        section.addView(sub);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);

        ImageView preview = new ImageView(this);
        LinearLayout.LayoutParams pmlp = new LinearLayout.LayoutParams(dp(85), dp(85));
        preview.setLayoutParams(pmlp);
        preview.setScaleType(ImageView.ScaleType.CENTER_CROP);
        preview.setBackgroundColor(Color.parseColor("#1E293B"));
        loadImageIntoView(preview, currentUrl);
        row.addView(preview);

        LinearLayout btnsCol = new LinearLayout(this);
        btnsCol.setOrientation(LinearLayout.VERTICAL);
        btnsCol.setPadding(dp(12), 0, 0, 0);
        btnsCol.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        Button galleryBtn = new Button(this);
        galleryBtn.setText("📁 Gallery Se Upload Karein");
        galleryBtn.setTextSize(11);
        galleryBtn.setTypeface(null, Typeface.BOLD);
        galleryBtn.setTextColor(Color.WHITE);
        galleryBtn.setBackgroundResource(R.drawable.bg_button_red);
        galleryBtn.setPadding(dp(8), dp(8), dp(8), dp(8));
        galleryBtn.setOnClickListener(v -> {
            activeImageTargetInput = targetInput;
            activeImagePreviewView = preview;
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("image/*");
            startActivityForResult(Intent.createChooser(intent, "Photo Chunein"), REQ_PICK_DISH_IMAGE);
        });
        btnsCol.addView(galleryBtn);

        TextView orUrlNote = new TextView(this);
        orUrlNote.setText("Live Photo URL / Link:");
        orUrlNote.setTextSize(10);
        orUrlNote.setTextColor(theme.colorTextSecondary);
        orUrlNote.setPadding(0, dp(6), 0, dp(2));
        btnsCol.addView(orUrlNote);

        targetInput.setText(currentUrl != null ? currentUrl : "");
        targetInput.setHint("https://... image url");
        targetInput.setTextSize(11);
        targetInput.setTextColor(theme.colorInputText);
        targetInput.setHintTextColor(theme.colorInputHint);
        targetInput.setBackgroundResource(theme.resInputBg);
        targetInput.setPadding(dp(8), dp(6), dp(8), dp(6));
        targetInput.addTextChangedListener(new android.text.TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            public void afterTextChanged(android.text.Editable s) {
                loadImageIntoView(preview, s.toString().trim());
            }
        });
        btnsCol.addView(targetInput);

        row.addView(btnsCol);
        section.addView(row);

        TextView presetsTitle = new TextView(this);
        presetsTitle.setText("⚡ 1-Tap Ready Food Photo Presets (शानदार फूड फोटो):");
        presetsTitle.setTextSize(11);
        presetsTitle.setTypeface(null, Typeface.BOLD);
        presetsTitle.setTextColor(theme.colorTextPrimary);
        presetsTitle.setPadding(0, dp(10), 0, dp(4));
        section.addView(presetsTitle);

        HorizontalScrollView hsv = new HorizontalScrollView(this);
        hsv.setHorizontalScrollBarEnabled(false);
        LinearLayout presetsRow = new LinearLayout(this);
        presetsRow.setOrientation(LinearLayout.HORIZONTAL);
        presetsRow.setPadding(0, dp(2), 0, dp(4));

        String[][] presets = {
            {"🌯 Classic Roll", "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80"},
            {"🌶️ Spicy Shawarma", "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80"},
            {"🍽️ Platter", "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"},
            {"🍟 Loaded Fries", "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80"},
            {"🍗 Crispy Wings", "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80"},
            {"🧆 Falafel Roll", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80"},
            {"🥤 Mint Mojito", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80"},
            {"🍫 Cold Shake", "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80"},
            {"🫓 Rumali Combo", "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80"}
        };

        for (String[] pr : presets) {
            final String pName = pr[0];
            final String pUrl = pr[1];
            TextView chip = new TextView(this);
            chip.setText(pName);
            chip.setTextSize(11);
            chip.setPadding(dp(10), dp(5), dp(10), dp(5));
            chip.setBackgroundResource(theme.resOutlineBtn);
            chip.setTextColor(theme.colorTextPrimary);
            LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            clp.rightMargin = dp(6);
            chip.setLayoutParams(clp);

            chip.setOnClickListener(v -> {
                targetInput.setText(pUrl);
                loadImageIntoView(preview, pUrl);
                Toast.makeText(this, pName + " photo selected!", Toast.LENGTH_SHORT).show();
            });
            presetsRow.addView(chip);
        }
        hsv.addView(presetsRow);
        section.addView(hsv);

        parent.addView(section);
        return section;
    }

    private View createMenuItemCard(JSONObject item) {
        String id = item.optString("id", "");
        String name = item.optString("name", "Dish");
        double price = item.optDouble("price", 0);
        double origPrice = item.optDouble("originalPrice", 0);
        String category = item.optString("category", "General");
        boolean available = item.optBoolean("available", true);
        boolean isVeg = item.optBoolean("isVeg", false);
        String badge = item.optString("badge", "");

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(theme.resCardBg);
        card.setPadding(dp(14), dp(14), dp(14), dp(14));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        p.bottomMargin = dp(10);
        card.setLayoutParams(p);

        // Top info row
        LinearLayout topRow = new LinearLayout(this);
        topRow.setOrientation(LinearLayout.HORIZONTAL);
        topRow.setGravity(Gravity.CENTER_VERTICAL);

        ImageView itemThumb = new ImageView(this);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(dp(54), dp(54));
        tlp.rightMargin = dp(12);
        itemThumb.setLayoutParams(tlp);
        itemThumb.setScaleType(ImageView.ScaleType.CENTER_CROP);
        itemThumb.setBackgroundColor(Color.parseColor("#1E293B"));
        loadImageIntoView(itemThumb, item.optString("image", ""));
        topRow.addView(itemThumb);

        LinearLayout info = new LinearLayout(this);
        info.setOrientation(LinearLayout.VERTICAL);
        info.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        LinearLayout tagRow = new LinearLayout(this);
        tagRow.setOrientation(LinearLayout.HORIZONTAL);

        TextView catTv = new TextView(this);
        catTv.setText(category.toUpperCase(Locale.ROOT));
        catTv.setTextSize(10);
        catTv.setTypeface(null, Typeface.BOLD);
        catTv.setTextColor(Color.parseColor("#DC2626"));
        tagRow.addView(catTv);

        if (isVeg) {
            TextView vegPill = new TextView(this);
            vegPill.setText("VEG");
            vegPill.setTextSize(9);
            vegPill.setTypeface(null, Typeface.BOLD);
            vegPill.setTextColor(Color.parseColor("#10B981"));
            vegPill.setBackgroundResource(R.drawable.bg_pill_green);
            vegPill.setPadding(dp(6), dp(1), dp(6), dp(1));
            LinearLayout.LayoutParams vp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            vp.leftMargin = dp(6);
            vegPill.setLayoutParams(vp);
            tagRow.addView(vegPill);
        }

        if (!badge.isEmpty()) {
            TextView bPill = new TextView(this);
            bPill.setText(badge.toUpperCase(Locale.ROOT));
            bPill.setTextSize(9);
            bPill.setTypeface(null, Typeface.BOLD);
            bPill.setTextColor(Color.parseColor("#F59E0B"));
            bPill.setBackgroundResource(R.drawable.bg_pill_amber);
            bPill.setPadding(dp(6), dp(1), dp(6), dp(1));
            LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            bp.leftMargin = dp(6);
            bPill.setLayoutParams(bp);
            tagRow.addView(bPill);
        }
        info.addView(tagRow);

        TextView nameTv = new TextView(this);
        nameTv.setText(name);
        nameTv.setTextSize(15);
        nameTv.setTypeface(null, Typeface.BOLD);
        nameTv.setTextColor(theme.colorTextPrimary);
        info.addView(nameTv);

        TextView priceTv = new TextView(this);
        String priceText = "₹" + ((int) price);
        if (origPrice > price) priceText += "  (was ₹" + ((int) origPrice) + ")";
        priceTv.setText(priceText);
        priceTv.setTextSize(13);
        priceTv.setTypeface(null, Typeface.BOLD);
        priceTv.setTextColor(Color.parseColor("#10B981"));
        info.addView(priceTv);

        topRow.addView(info);

        // Edit button
        ImageView editBtn = new ImageView(this);
        editBtn.setImageResource(R.drawable.ic_edit_line);
        editBtn.setImageTintList(ColorStateList.valueOf(theme.colorTextSecondary));
        editBtn.setBackgroundResource(theme.resOutlineBtn);
        editBtn.setPadding(dp(7), dp(7), dp(7), dp(7));
        LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(dp(32), dp(32));
        ep.rightMargin = dp(6);
        editBtn.setLayoutParams(ep);
        editBtn.setOnClickListener(v -> showAddOrEditDishDialog(item));
        topRow.addView(editBtn);

        // Delete button
        ImageView delBtn = new ImageView(this);
        delBtn.setImageResource(R.drawable.ic_trash_line);
        delBtn.setImageTintList(ColorStateList.valueOf(Color.parseColor("#EF4444")));
        delBtn.setBackgroundResource(theme.resOutlineBtn);
        delBtn.setPadding(dp(7), dp(7), dp(7), dp(7));
        delBtn.setLayoutParams(new LinearLayout.LayoutParams(dp(32), dp(32)));
        delBtn.setOnClickListener(v -> confirmDeleteDish(id, name));
        topRow.addView(delBtn);

        card.addView(topRow);

        // 1-Tap Stock Switch
        Button toggleBtn = new Button(this);
        toggleBtn.setTextSize(12);
        toggleBtn.setTypeface(null, Typeface.BOLD);
        toggleBtn.setPadding(dp(12), dp(8), dp(12), dp(8));
        LinearLayout.LayoutParams tbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tbp.topMargin = dp(10);
        toggleBtn.setLayoutParams(tbp);

        if (available) {
            toggleBtn.setText("● IN STOCK (Tap to mark Sold Out)");
            toggleBtn.setTextColor(Color.parseColor("#10B981"));
            toggleBtn.setBackgroundResource(R.drawable.bg_pill_green);
        } else {
            toggleBtn.setText("● SOLD OUT (Tap to mark In Stock)");
            toggleBtn.setTextColor(Color.parseColor("#DC2626"));
            toggleBtn.setBackgroundResource(R.drawable.bg_pill_red);
        }

        toggleBtn.setOnClickListener(v -> {
            boolean newStatus = !available;
            SmsGatewayService.sendToggleAvailability(id, newStatus);
            Toast.makeText(this, name + (newStatus ? " marked In Stock" : " marked Sold Out"), Toast.LENGTH_SHORT).show();
        });
        card.addView(toggleBtn);

        return card;
    }

    private void showAddOrEditDishDialog(JSONObject existing) {
        boolean isEdit = (existing != null);
        AlertDialog.Builder builder = createDialogBuilder();
        builder.setTitle(isEdit ? "✏️ Edit Dish (डिश एडिट करें)" : "➕ Add New Dish (नई डिश जोड़ें)");

        ScrollView sv = new ScrollView(this);
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(20), dp(10), dp(20), dp(10));

        // 1. Photo Picker Section
        EditText imgInput = new EditText(this);
        String currentImg = isEdit ? existing.optString("image", "") : "";
        createImagePickerSection(form, currentImg, imgInput, "📸 DISH PHOTO (डिश की फोटो - वेबसाइट पर दिखेगी)");

        // 2. Dish Name
        EditText nameInput = createLabeledInput(form, "DISH NAME (डिश का नाम) *", isEdit ? existing.optString("name", "") : "");
        nameInput.setHint("e.g. Charcoal Chicken Shawarma Roll");
        form.addView(createChipGroup(
            new String[]{"🌯 Classic Roll", "🌶️ Spicy Shawarma", "🍽️ Charcoal Platter", "🍟 Loaded Fries", "🧆 Falafel Roll", "🥤 Mint Mojito", "🍗 Crispy Wings", "Custom"},
            new String[]{"Classic Chicken Shawarma", "Spicy Garlic Shawarma", "Charcoal Platter Special", "Loaded Cheese Fries", "Falafel Hummus Roll", "Mint Mojito", "Crispy Chicken Wings", nameInput.getText().toString()},
            nameInput.getText().toString(), nameInput));

        // 3. Category
        List<String> catOptionsList = new ArrayList<>();
        List<String> catValuesList = new ArrayList<>();
        catOptionsList.add("🌯 Shawarmas"); catValuesList.add("shawarmas");
        catOptionsList.add("🍽️ Platters"); catValuesList.add("platters");
        catOptionsList.add("🍟 Fries"); catValuesList.add("fries");
        catOptionsList.add("🥤 Drinks"); catValuesList.add("drinks");
        catOptionsList.add("🍗 Starters"); catValuesList.add("starters");

        if (SmsGatewayService.categoriesList != null) {
            for (JSONObject c : SmsGatewayService.categoriesList) {
                String cId = c.optString("id", "").toLowerCase(Locale.ROOT);
                String cName = c.optString("name", cId);
                if (!catValuesList.contains(cId) && !cId.isEmpty()) {
                    catOptionsList.add(cName);
                    catValuesList.add(cId);
                }
            }
        }
        catOptionsList.add("Custom");
        catValuesList.add(isEdit ? existing.optString("category", "shawarmas") : "shawarmas");

        EditText catInput = createLabeledInput(form, "CATEGORY (कैटेगरी) *", isEdit ? existing.optString("category", "shawarmas") : "shawarmas");
        form.addView(createChipGroup(
            catOptionsList.toArray(new String[0]),
            catValuesList.toArray(new String[0]),
            catInput.getText().toString().toLowerCase(Locale.ROOT), catInput));

        // 4. Food Type (Veg / Non-Veg)
        TextView vegLbl = new TextView(this);
        vegLbl.setText("FOOD TYPE (वेज / नॉन-वेज)");
        vegLbl.setTextSize(11);
        vegLbl.setTypeface(null, Typeface.BOLD);
        vegLbl.setTextColor(theme.colorTextSecondary);
        vegLbl.setPadding(0, dp(8), 0, dp(4));
        form.addView(vegLbl);

        EditText vegIn = new EditText(this);
        vegIn.setVisibility(View.GONE);
        form.addView(vegIn);
        boolean initialVeg = isEdit ? existing.optBoolean("isVeg", false) : false;
        vegIn.setText(initialVeg ? "veg" : "nonveg");
        form.addView(createChipGroup(
            new String[]{"🔴 Non-Veg (चिकन / मीट)", "🟢 100% Pure Veg (शाकाहारी)"},
            new String[]{"nonveg", "veg"},
            initialVeg ? "veg" : "nonveg", vegIn));

        // 5. Price
        EditText priceInput = createLabeledInput(form, "SELLING PRICE ₹ (विक्रय मूल्य) *", isEdit ? String.valueOf((int) existing.optDouble("price", 179)) : "179");
        priceInput.setInputType(InputType.TYPE_CLASS_NUMBER);
        form.addView(createChipGroup(
            new String[]{"₹99", "₹129", "₹149", "₹179", "₹199", "₹249", "₹299", "₹399", "Custom"},
            new String[]{"99", "129", "149", "179", "199", "249", "299", "399", priceInput.getText().toString()},
            priceInput.getText().toString(), priceInput));

        // 6. Original / Strike Price
        EditText origPriceInput = createLabeledInput(form, "ORIGINAL / STRIKE PRICE ₹ (डिस्काउंट दिखाने के लिए - Optional)", isEdit && existing.has("originalPrice") ? String.valueOf((int) existing.optDouble("originalPrice", 0)) : "0");
        origPriceInput.setInputType(InputType.TYPE_CLASS_NUMBER);
        form.addView(createChipGroup(
            new String[]{"₹0 (No Strike)", "₹199", "₹249", "₹299", "₹349", "₹399", "₹499", "Custom"},
            new String[]{"0", "199", "249", "299", "349", "399", "499", origPriceInput.getText().toString()},
            origPriceInput.getText().toString(), origPriceInput));

        // 7. Badge Tag
        EditText badgeInput = createLabeledInput(form, "BADGE TAG (स्पेशल टैग - Optional)", isEdit ? existing.optString("badge", "") : "");
        badgeInput.setHint("e.g. Bestseller, Special");
        form.addView(createChipGroup(
            new String[]{"None", "🔥 Bestseller", "⭐ Chef's Special", "🌶️ Extra Spicy", "✨ New Launch", "👑 Must Try"},
            new String[]{"", "Bestseller", "Chef Special", "Extra Spicy", "New", "Must Try"},
            badgeInput.getText().toString(), badgeInput));

        // 8. Prep Time
        EditText prepInput = createLabeledInput(form, "PREP TIME (तैयार होने का समय)", isEdit ? existing.optString("prepTime", "15-20 min") : "15-20 min");
        form.addView(createChipGroup(
            new String[]{"10-15 min", "15-20 min", "20-25 min", "25-30 min"},
            new String[]{"10-15 min", "15-20 min", "20-25 min", "25-30 min"},
            prepInput.getText().toString(), prepInput));

        // 9. Description
        EditText descInput = createLabeledInput(form, "DESCRIPTION (डिश की जानकारी / सामग्री)", isEdit ? existing.optString("description", "") : "");
        descInput.setHint("e.g. Fresh roasted chicken loaded with garlic mayonnaise");

        // 10. Availability Stock
        TextView stockLbl = new TextView(this);
        stockLbl.setText("STOCK STATUS (उपलब्धता)");
        stockLbl.setTextSize(11);
        stockLbl.setTypeface(null, Typeface.BOLD);
        stockLbl.setTextColor(theme.colorTextSecondary);
        stockLbl.setPadding(0, dp(8), 0, dp(4));
        form.addView(stockLbl);

        EditText stockIn = new EditText(this);
        stockIn.setVisibility(View.GONE);
        form.addView(stockIn);
        boolean initialAvail = !isEdit || existing.optBoolean("available", true);
        stockIn.setText(initialAvail ? "instock" : "soldout");
        form.addView(createChipGroup(
            new String[]{"🟢 In Stock (उपलब्ध है)", "🔴 Sold Out (खत्म)"},
            new String[]{"instock", "soldout"},
            initialAvail ? "instock" : "soldout", stockIn));

        sv.addView(form);
        builder.setView(sv);

        builder.setPositiveButton(isEdit ? "Update Dish" : "Add Dish", (dialog, which) -> {
            String name = nameInput.getText().toString().trim();
            String cat = catInput.getText().toString().trim().toLowerCase(Locale.ROOT);
            double price = 0;
            try { price = Double.parseDouble(priceInput.getText().toString().trim()); } catch (Exception ignored) {}
            double origPrice = 0;
            try { origPrice = Double.parseDouble(origPriceInput.getText().toString().trim()); } catch (Exception ignored) {}

            if (name.isEmpty() || price <= 0) {
                Toast.makeText(this, "Please enter valid name and price", Toast.LENGTH_SHORT).show();
                return;
            }

            String chosenImg = imgInput.getText().toString().trim();
            if (chosenImg.isEmpty()) {
                chosenImg = "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80";
            }

            boolean isVeg = "veg".equals(vegIn.getText().toString().trim());
            boolean isAvailable = "instock".equals(stockIn.getText().toString().trim());

            try {
                if (isEdit) {
                    JSONObject updates = new JSONObject();
                    updates.put("name", name);
                    updates.put("category", cat.isEmpty() ? "shawarmas" : cat);
                    updates.put("price", price);
                    updates.put("originalPrice", origPrice);
                    updates.put("isVeg", isVeg);
                    updates.put("badge", badgeInput.getText().toString().trim());
                    updates.put("prepTime", prepInput.getText().toString().trim());
                    updates.put("description", descInput.getText().toString().trim());
                    updates.put("image", chosenImg);
                    updates.put("available", isAvailable);
                    SmsGatewayService.sendUpdateMenuItem(existing.optString("id"), updates);
                    Toast.makeText(this, "Dish updated successfully! 🚀", Toast.LENGTH_SHORT).show();
                } else {
                    JSONObject newItem = new JSONObject();
                    newItem.put("id", "dish-" + System.currentTimeMillis());
                    newItem.put("name", name);
                    newItem.put("category", cat.isEmpty() ? "shawarmas" : cat);
                    newItem.put("price", price);
                    newItem.put("originalPrice", origPrice);
                    newItem.put("isVeg", isVeg);
                    newItem.put("badge", badgeInput.getText().toString().trim());
                    newItem.put("prepTime", prepInput.getText().toString().trim());
                    newItem.put("description", descInput.getText().toString().trim());
                    newItem.put("image", chosenImg);
                    newItem.put("available", isAvailable);
                    newItem.put("rating", 5);
                    newItem.put("reviews", 1);
                    SmsGatewayService.sendAddMenuItem(newItem);
                    Toast.makeText(this, "Dish added to Menu! 🚀", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception ignored) {}
        });

        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    private void confirmDeleteDish(String id, String name) {
        createDialogBuilder()
                .setTitle("Delete Dish")
                .setMessage("Kya aap \"" + name + "\" ko menu se permanently delete karna chahte hain?")
                .setPositiveButton("Delete", (d, w) -> {
                    SmsGatewayService.sendDeleteMenuItem(id);
                    Toast.makeText(this, "Dish deleted", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    // ==========================================
    // TAB 3: OFFERS, DEALS & HERO BANNER
    // ==========================================

    private void renderOffersTab() {
        LinearLayout container = tabContainers[3];
        container.removeAllViews();

        // 0. FREE DELIVERY THRESHOLD CARD (Prominent at top)
        addFreeDeliveryThresholdCard(container);

        // 1. DEALS SECTION
        LinearLayout dealsHeader = new LinearLayout(this);
        dealsHeader.setOrientation(LinearLayout.HORIZONTAL);
        dealsHeader.setGravity(Gravity.CENTER_VERTICAL);
        dealsHeader.setPadding(0, 0, 0, dp(10));

        TextView dTitle = new TextView(this);
        dTitle.setText("PROMO CODES & DEALS (" + SmsGatewayService.dealsList.size() + ")");
        dTitle.setTextSize(15);
        dTitle.setTypeface(null, Typeface.BOLD);
        dTitle.setTextColor(theme.colorTextPrimary);
        dTitle.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        dealsHeader.addView(dTitle);

        Button addDealBtn = new Button(this);
        addDealBtn.setText("+ NEW DEAL");
        addDealBtn.setTextSize(11);
        addDealBtn.setTypeface(null, Typeface.BOLD);
        addDealBtn.setTextColor(Color.WHITE);
        addDealBtn.setBackgroundResource(R.drawable.bg_button_red);
        addDealBtn.setPadding(dp(12), dp(6), dp(12), dp(6));
        addDealBtn.setOnClickListener(v -> showAddDealDialog());
        dealsHeader.addView(addDealBtn);
        container.addView(dealsHeader);

        if (SmsGatewayService.dealsList.isEmpty()) {
            TextView noDeals = new TextView(this);
            noDeals.setText("No active deals on server.");
            noDeals.setTextSize(13);
            noDeals.setTextColor(theme.colorTextMuted);
            noDeals.setPadding(0, dp(10), 0, dp(20));
            container.addView(noDeals);
        } else {
            for (JSONObject deal : SmsGatewayService.dealsList) {
                String dId = deal.optString("id");
                String code = deal.optString("code", "DEAL");
                String dName = deal.optString("title", "Discount Offer");
                String dType = deal.optString("discountType", "percentage");
                double dVal = deal.optDouble("discountValue", deal.optDouble("discountPercent", 0));
                int minOrder = deal.optInt("minOrder", 0);
                boolean isActive = deal.optBoolean("active", true);
                int usageCount = deal.optInt("usageCount", 0);
                int usageLimit = deal.optInt("usageLimit", 0);
                String expiry = deal.optString("endDate", "Never");
                String happyHourStart = deal.optString("happyHourStart", "");
                String happyHourEnd = deal.optString("happyHourEnd", "");

                LinearLayout dCard = new LinearLayout(this);
                dCard.setOrientation(LinearLayout.HORIZONTAL);
                dCard.setBackgroundResource(theme.resCardBg);
                dCard.setGravity(Gravity.CENTER_VERTICAL);
                dCard.setPadding(dp(14), dp(14), dp(14), dp(14));
                LinearLayout.LayoutParams dp1 = new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                dp1.bottomMargin = dp(10);
                dCard.setLayoutParams(dp1);
                
                if (!isActive) dCard.setAlpha(0.5f);

                LinearLayout dInfo = new LinearLayout(this);
                dInfo.setOrientation(LinearLayout.VERTICAL);
                dInfo.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

                LinearLayout titleRow = new LinearLayout(this);
                titleRow.setOrientation(LinearLayout.HORIZONTAL);
                titleRow.setGravity(Gravity.CENTER_VERTICAL);
                
                TextView codeTv = new TextView(this);
                codeTv.setText(code);
                codeTv.setTextSize(16);
                codeTv.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
                codeTv.setTextColor(Color.parseColor("#DC2626"));
                titleRow.addView(codeTv);
                
                TextView typeBadge = new TextView(this);
                typeBadge.setText(dType.toUpperCase());
                typeBadge.setTextSize(10);
                typeBadge.setTextColor(Color.WHITE);
                typeBadge.setBackgroundResource(R.drawable.bg_button_red);
                typeBadge.setPadding(dp(6), dp(2), dp(6), dp(2));
                LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                bp.leftMargin = dp(8);
                typeBadge.setLayoutParams(bp);
                titleRow.addView(typeBadge);
                
                dInfo.addView(titleRow);

                TextView descTv = new TextView(this);
                descTv.setText(dName + " • " + dVal + (dType.equals("percentage") ? "% OFF" : " OFF") + " on orders above ₹" + minOrder);
                descTv.setTextSize(12);
                descTv.setTextColor(theme.colorTextPrimary);
                dInfo.addView(descTv);
                
                TextView statsTv = new TextView(this);
                String statsStr = "Used: " + usageCount + (usageLimit > 0 ? "/" + usageLimit : "") + " | Expiry: " + expiry;
                if (!happyHourStart.isEmpty() && !happyHourEnd.isEmpty()) {
                    statsStr += "\nHappy Hour: " + happyHourStart + " - " + happyHourEnd;
                }
                statsTv.setText(statsStr);
                statsTv.setTextSize(11);
                statsTv.setTextColor(theme.colorTextSecondary);
                dInfo.addView(statsTv);
                
                dCard.addView(dInfo);
                
                ImageView editBtn = new ImageView(this);
                editBtn.setImageResource(android.R.drawable.ic_menu_edit);
                editBtn.setImageTintList(ColorStateList.valueOf(Color.parseColor("#3B82F6")));
                editBtn.setBackgroundResource(theme.resOutlineBtn);
                editBtn.setPadding(dp(7), dp(7), dp(7), dp(7));
                LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(dp(32), dp(32));
                ep.rightMargin = dp(8);
                editBtn.setLayoutParams(ep);
                editBtn.setOnClickListener(v -> showEditDealDialog(deal));
                dCard.addView(editBtn);

                ImageView delBtn = new ImageView(this);
                delBtn.setImageResource(R.drawable.ic_trash_line);
                delBtn.setImageTintList(ColorStateList.valueOf(Color.parseColor("#EF4444")));
                delBtn.setBackgroundResource(theme.resOutlineBtn);
                delBtn.setPadding(dp(7), dp(7), dp(7), dp(7));
                delBtn.setLayoutParams(new LinearLayout.LayoutParams(dp(32), dp(32)));
                delBtn.setOnClickListener(v -> {
                    SmsGatewayService.sendDeleteDeal(dId);
                    Toast.makeText(this, "Deal deleted", Toast.LENGTH_SHORT).show();
                });
                dCard.addView(delBtn);

                container.addView(dCard);
            }
        }

        // 2. HERO BANNER LIVE EDITOR
        TextView heroSecTitle = new TextView(this);
        heroSecTitle.setText("HOMEPAGE HERO BANNER CUSTOMIZER");
        heroSecTitle.setTextSize(15);
        heroSecTitle.setTypeface(null, Typeface.BOLD);
        heroSecTitle.setTextColor(theme.colorTextPrimary);
        heroSecTitle.setPadding(0, dp(18), 0, dp(2));
        container.addView(heroSecTitle);

        TextView heroSecSub = new TextView(this);
        heroSecSub.setText("Directly updates the customer storefront header");
        heroSecSub.setTextSize(11);
        heroSecSub.setTextColor(theme.colorTextSecondary);
        heroSecSub.setPadding(0, 0, 0, dp(12));
        container.addView(heroSecSub);

        LinearLayout heroCard = new LinearLayout(this);
        heroCard.setOrientation(LinearLayout.VERTICAL);
        heroCard.setBackgroundResource(theme.resCardBg);
        heroCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        container.addView(heroCard);

        JSONObject h = SmsGatewayService.heroBannerObj != null ? SmsGatewayService.heroBannerObj : new JSONObject();

        EditText circleImgInput = new EditText(this);
        String currentCircleImg = h.optString("circleImage", "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=85");
        createImagePickerSection(heroCard, currentCircleImg, circleImgInput, "🎯 HERO SHOWCASE DISH PHOTO (वेबसाइट का गोल फोटो)");

        EditText badgeIn = createLabeledInput(heroCard, "Badge Tag", h.optString("badgeText", ""));
        EditText t1In = createLabeledInput(heroCard, "Title Line 1", h.optString("titleLine1", ""));
        EditText t2In = createLabeledInput(heroCard, "Title Line 2", h.optString("titleLine2", ""));
        EditText tHighIn = createLabeledInput(heroCard, "Title Highlight", h.optString("titleHighlight", ""));
        EditText subIn = createLabeledInput(heroCard, "Subtitle", h.optString("subtitle", ""));
        EditText priceIn = createLabeledInput(heroCard, "Price Text", h.optString("priceValue", ""));
        EditText marqIn = createLabeledInput(heroCard, "Marquee Ticker Text", h.optString("marqueeText", ""));

        Button saveHeroBtn = new Button(this);
        saveHeroBtn.setText("SAVE & SYNC HERO BANNER");
        saveHeroBtn.setTextSize(13);
        saveHeroBtn.setTypeface(null, Typeface.BOLD);
        saveHeroBtn.setTextColor(Color.WHITE);
        saveHeroBtn.setBackgroundResource(R.drawable.bg_button_red);
        saveHeroBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams shp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        shp.topMargin = dp(14);
        saveHeroBtn.setLayoutParams(shp);
        saveHeroBtn.setOnClickListener(v -> {
            try {
                JSONObject updated = new JSONObject();
                updated.put("circleImage", circleImgInput.getText().toString().trim());
                updated.put("badgeText", badgeIn.getText().toString().trim());
                updated.put("titleLine1", t1In.getText().toString().trim());
                updated.put("titleLine2", t2In.getText().toString().trim());
                updated.put("titleHighlight", tHighIn.getText().toString().trim());
                updated.put("subtitle", subIn.getText().toString().trim());
                updated.put("priceValue", priceIn.getText().toString().trim());
                updated.put("marqueeText", marqIn.getText().toString().trim());
                SmsGatewayService.sendUpdateHeroBanner(updated);
                Toast.makeText(this, "Hero Banner Synced to Website!", Toast.LENGTH_SHORT).show();
            } catch (Exception ignored) {}
        });
        heroCard.addView(saveHeroBtn);
    }

    private void showAddDealDialog() {
        showEditDealDialog(null);
    }

    
    
    private void showEditDealDialog(JSONObject deal) {
        boolean isEdit = (deal != null);
        AlertDialog.Builder builder = createDialogBuilder();
        builder.setTitle(isEdit ? "Edit Promo Code" : "Add New Promo Code");

        ScrollView scrollView = new ScrollView(this);
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(20), dp(10), dp(20), dp(10));
        scrollView.addView(form);

        EditText codeIn = createLabeledInput(form, "Coupon Code", isEdit ? deal.optString("code") : "");
        EditText titleIn = createLabeledInput(form, "Title", isEdit ? deal.optString("title") : "");
        EditText descIn = createLabeledInput(form, "Description", isEdit ? deal.optString("description") : "");
        
        // --- CHIP SELECTORS --- //
        String initialType = isEdit ? deal.optString("discountType", "percentage") : "percentage";
        TextView typeLbl = new TextView(this); typeLbl.setText("Discount Type"); typeLbl.setTextSize(11); typeLbl.setTextColor(theme.colorTextSecondary); form.addView(typeLbl);
        EditText typeIn = new EditText(this); typeIn.setVisibility(View.GONE); form.addView(typeIn);
        form.addView(createChipGroup(
            new String[]{"% Percentage", "₹ Flat Off", "🚚 Free Delivery", "🎁 Buy 1 Get 1", "🍟 Free Item"},
            new String[]{"percentage", "flat", "freeDelivery", "bogo", "freeItem"},
            initialType, typeIn));
        
        TextView valLbl = new TextView(this); valLbl.setText("Discount Value"); valLbl.setTextSize(11); valLbl.setTextColor(theme.colorTextSecondary); form.addView(valLbl);
        EditText valIn = new EditText(this); valIn.setText(isEdit ? String.valueOf(deal.optDouble("discountValue", deal.optDouble("discountPercent", 0))) : ""); valIn.setBackgroundResource(theme.resInputBg); valIn.setTextColor(theme.colorInputText); valIn.setPadding(dp(12), dp(10), dp(12), dp(10)); form.addView(valIn);
        form.addView(createChipGroup(
            new String[]{"10%", "20%", "30%", "50%", "₹50", "₹100", "₹150", "₹200", "Custom"},
            new String[]{"10", "20", "30", "50", "50", "100", "150", "200", valIn.getText().toString()},
            valIn.getText().toString(), valIn));
            
        LinearLayout maxCapLayout = new LinearLayout(this);
        maxCapLayout.setOrientation(LinearLayout.HORIZONTAL);
        TextView maxCapLbl = new TextView(this); maxCapLbl.setText("Max Cap (Up to ₹) "); maxCapLbl.setTextSize(11); maxCapLbl.setTypeface(null, Typeface.BOLD); maxCapLbl.setTextColor(theme.colorTextSecondary); maxCapLayout.addView(maxCapLbl);
        TextView maxCapInfo = new TextView(this); maxCapInfo.setText("ℹ️"); maxCapInfo.setPadding(dp(4),0,dp(4),0); maxCapInfo.setOnClickListener(v -> showTooltip("Max Cap", "Percentage discount se zyada se zyada kitne rupaye ki chhoot mil sakti hai. Jaise 50% discount par max ₹150 cap lagane se ₹500 ke order par ₹150 hi discount hoga, ₹250 nahi.")); maxCapLayout.addView(maxCapInfo);
        form.addView(maxCapLayout);
        
        EditText maxIn = new EditText(this); maxIn.setText(isEdit ? String.valueOf(deal.optDouble("maxDiscount", 0)) : "0"); maxIn.setBackgroundResource(theme.resInputBg); maxIn.setTextColor(theme.colorInputText); maxIn.setPadding(dp(12), dp(10), dp(12), dp(10)); form.addView(maxIn);
        form.addView(createChipGroup(
            new String[]{"₹50", "₹100", "₹150", "₹200", "No Cap", "Custom"},
            new String[]{"50", "100", "150", "200", "0", maxIn.getText().toString()},
            maxIn.getText().toString(), maxIn));

        TextView minLbl = new TextView(this); minLbl.setText("Min Order Threshold"); minLbl.setTextSize(11); minLbl.setTextColor(theme.colorTextSecondary); form.addView(minLbl);
        EditText minIn = new EditText(this); minIn.setText(isEdit ? String.valueOf(deal.optDouble("minOrder", 0)) : "0"); minIn.setBackgroundResource(theme.resInputBg); minIn.setTextColor(theme.colorInputText); minIn.setPadding(dp(12), dp(10), dp(12), dp(10)); form.addView(minIn);
        form.addView(createChipGroup(
            new String[]{"₹0 (Any)", "₹199", "₹299", "₹399", "₹499", "Custom"},
            new String[]{"0", "199", "299", "399", "499", minIn.getText().toString()},
            minIn.getText().toString(), minIn));
            
        TextView usageLbl = new TextView(this); usageLbl.setText("Usage Limit"); usageLbl.setTextSize(11); usageLbl.setTextColor(theme.colorTextSecondary); form.addView(usageLbl);
        EditText usageLimitIn = new EditText(this); usageLimitIn.setText(isEdit ? String.valueOf(deal.optInt("usageLimit", 0)) : "0"); usageLimitIn.setBackgroundResource(theme.resInputBg); usageLimitIn.setTextColor(theme.colorInputText); usageLimitIn.setPadding(dp(12), dp(10), dp(12), dp(10)); form.addView(usageLimitIn);
        form.addView(createChipGroup(
            new String[]{"Unlimited", "50 uses", "100 uses", "500 uses", "Custom"},
            new String[]{"0", "50", "100", "500", usageLimitIn.getText().toString()},
            usageLimitIn.getText().toString(), usageLimitIn));

        TextView perUserLbl = new TextView(this); perUserLbl.setText("Per-User Limit"); perUserLbl.setTextSize(11); perUserLbl.setTextColor(theme.colorTextSecondary); form.addView(perUserLbl);
        EditText perUserLimitIn = new EditText(this); perUserLimitIn.setText(isEdit ? String.valueOf(deal.optInt("perUserLimit", 1)) : "1"); perUserLimitIn.setBackgroundResource(theme.resInputBg); perUserLimitIn.setTextColor(theme.colorInputText); perUserLimitIn.setPadding(dp(12), dp(10), dp(12), dp(10)); form.addView(perUserLimitIn);
        form.addView(createChipGroup(
            new String[]{"1 time per user", "2 times", "Unlimited"},
            new String[]{"1", "2", "0"},
            perUserLimitIn.getText().toString(), perUserLimitIn));

        EditText startIn = createLabeledInput(form, "Start Date (YYYY-MM-DD)", isEdit ? deal.optString("startDate") : "");
        EditText endIn = createLabeledInput(form, "End Date (YYYY-MM-DD)", isEdit ? deal.optString("endDate") : "");
        EditText hhStartIn = createLabeledInput(form, "Happy Hour Start (HH:MM)", isEdit ? deal.optString("happyHourStart") : "");
        EditText hhEndIn = createLabeledInput(form, "Happy Hour End (HH:MM)", isEdit ? deal.optString("happyHourEnd") : "");

        LinearLayout firstOrderLayout = new LinearLayout(this);
        firstOrderLayout.setOrientation(LinearLayout.HORIZONTAL);
        CheckBox firstOrderCb = new CheckBox(this);
        firstOrderCb.setText("First Order Only ");
        firstOrderCb.setTextColor(theme.colorTextPrimary);
        firstOrderCb.setChecked(isEdit && deal.optBoolean("firstOrderOnly", false));
        firstOrderLayout.addView(firstOrderCb);
        TextView firstInfo = new TextView(this);
        firstInfo.setText("ℹ️");
        firstInfo.setPadding(dp(4),0,dp(4),0);
        firstInfo.setOnClickListener(v -> showTooltip("First Order Only", "Sirf un naye customers ko milega jinka pehla order hai. Purane customers par ye code nahi lagega."));
        firstOrderLayout.addView(firstInfo);
        form.addView(firstOrderLayout);

        LinearLayout autoApplyLayout = new LinearLayout(this);
        autoApplyLayout.setOrientation(LinearLayout.HORIZONTAL);
        CheckBox autoApplyCb = new CheckBox(this);
        autoApplyCb.setText("Auto Apply ");
        autoApplyCb.setTextColor(theme.colorTextPrimary);
        autoApplyCb.setChecked(isEdit && deal.optBoolean("autoApply", false));
        autoApplyLayout.addView(autoApplyCb);
        TextView autoInfo = new TextView(this);
        autoInfo.setText("ℹ️");
        autoInfo.setPadding(dp(4),0,dp(4),0);
        autoInfo.setOnClickListener(v -> showTooltip("Auto Apply", "Customer ko coupon code type nahi karna padega! Bag me samaan add karte hi apne aap sabse badhiya discount lag jayega."));
        autoApplyLayout.addView(autoInfo);
        form.addView(autoApplyLayout);

        LinearLayout activeLayout = new LinearLayout(this);
        activeLayout.setOrientation(LinearLayout.HORIZONTAL);
        CheckBox activeCb = new CheckBox(this);
        activeCb.setText("Active ");
        activeCb.setTextColor(theme.colorTextPrimary);
        activeCb.setChecked(!isEdit || deal.optBoolean("active", true));
        activeLayout.addView(activeCb);
        TextView activeInfo = new TextView(this);
        activeInfo.setText("ℹ️");
        activeInfo.setPadding(dp(4),0,dp(4),0);
        activeInfo.setOnClickListener(v -> showTooltip("Active / Inactive Toggle", "Offer ko temporary band ya chalu karne ke liye. Inactive karne par website par ye discount nahi lagega."));
        activeLayout.addView(activeInfo);
        form.addView(activeLayout);
        
        TextView bogoInfoBtn = new TextView(this);
        bogoInfoBtn.setText("ℹ️ What is BOGO?");
        bogoInfoBtn.setTextColor(Color.parseColor("#3B82F6"));
        bogoInfoBtn.setPadding(0,dp(8),0,dp(8));
        bogoInfoBtn.setOnClickListener(v -> showTooltip("BOGO (Buy 1 Get 1)", "Customer ke cart me se ek item free ho jayega."));
        form.addView(bogoInfoBtn);

        builder.setView(scrollView);
        builder.setPositiveButton(isEdit ? "Save Deal" : "Create Deal", (d, w) -> {
            try {
                JSONObject updated = isEdit ? new JSONObject(deal.toString()) : new JSONObject();
                updated.put("code", codeIn.getText().toString().trim().toUpperCase(Locale.ROOT));
                updated.put("title", titleIn.getText().toString().trim());
                updated.put("description", descIn.getText().toString().trim());
                updated.put("discountType", typeIn.getText().toString().trim());
                
                String valStr = valIn.getText().toString().trim();
                updated.put("discountValue", valStr.isEmpty() ? 0 : Double.parseDouble(valStr));
                updated.put("discountPercent", updated.optDouble("discountValue")); 
                
                String maxStr = maxIn.getText().toString().trim();
                updated.put("maxDiscount", maxStr.isEmpty() ? 0 : Double.parseDouble(maxStr));
                
                String minStr = minIn.getText().toString().trim();
                updated.put("minOrder", minStr.isEmpty() ? 0 : Double.parseDouble(minStr));
                
                String usageStr = usageLimitIn.getText().toString().trim();
                updated.put("usageLimit", usageStr.isEmpty() ? 0 : Integer.parseInt(usageStr));
                
                String perUserStr = perUserLimitIn.getText().toString().trim();
                updated.put("perUserLimit", perUserStr.isEmpty() ? 0 : Integer.parseInt(perUserStr));
                
                updated.put("startDate", startIn.getText().toString().trim());
                updated.put("endDate", endIn.getText().toString().trim());
                updated.put("happyHourStart", hhStartIn.getText().toString().trim());
                updated.put("happyHourEnd", hhEndIn.getText().toString().trim());
                updated.put("firstOrderOnly", firstOrderCb.isChecked());
                updated.put("autoApply", autoApplyCb.isChecked());
                updated.put("active", activeCb.isChecked());

                if (updated.optString("code").isEmpty()) {
                    Toast.makeText(this, "Code cannot be empty", Toast.LENGTH_SHORT).show();
                    return;
                }

                if (isEdit) {
                    SmsGatewayService.sendUpdateDeal(updated);
                    Toast.makeText(this, "Deal Updated!", Toast.LENGTH_SHORT).show();
                } else {
                    SmsGatewayService.sendAddDeal(updated);
                    Toast.makeText(this, "Deal Created!", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "Error saving deal", Toast.LENGTH_SHORT).show();
            }
        });
        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    private void renderCustomersTab() {
        LinearLayout container = tabContainers[4];
        container.removeAllViews();

        TextView title = new TextView(this);
        title.setText("CUSTOMER DATABASE (" + SmsGatewayService.customersList.size() + ")");
        title.setTextSize(16);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(theme.colorTextPrimary);
        container.addView(title);

        TextView sub = new TextView(this);
        sub.setText("All registered customers with verified phone numbers & order history");
        sub.setTextSize(11);
        sub.setTextColor(theme.colorTextSecondary);
        sub.setPadding(0, dp(2), 0, dp(12));
        container.addView(sub);

        // Search bar
        EditText searchBar = new EditText(this);
        searchBar.setHint("Search customers by name, phone, address...");
        searchBar.setTextColor(theme.colorInputText);
        searchBar.setHintTextColor(theme.colorInputHint);
        searchBar.setTextSize(12);
        searchBar.setBackgroundResource(theme.resInputBg);
        searchBar.setPadding(dp(12), dp(10), dp(12), dp(10));
        searchBar.setText(customerSearchQuery);
        searchBar.addTextChangedListener(new android.text.TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                customerSearchQuery = s.toString();
            }
            public void afterTextChanged(android.text.Editable s) {
                renderFilteredCustomerList(container);
            }
        });
        container.addView(searchBar);

        // Container for customer list
        LinearLayout listHolder = new LinearLayout(this);
        listHolder.setOrientation(LinearLayout.VERTICAL);
        listHolder.setTag("customers_list_holder");
        listHolder.setPadding(0, dp(12), 0, 0);
        container.addView(listHolder);

        renderFilteredCustomerList(container);
    }

    private void renderFilteredCustomerList(LinearLayout rootContainer) {
        LinearLayout listHolder = rootContainer.findViewWithTag("customers_list_holder");
        if (listHolder == null) return;
        listHolder.removeAllViews();

        String q = customerSearchQuery.toLowerCase(Locale.ROOT).trim();
        List<JSONObject> filtered = new ArrayList<>();

        for (JSONObject c : SmsGatewayService.customersList) {
            String name = c.optString("name", "");
            String phone = c.optString("phone", "");
            String address = c.optString("address", "");
            if (!q.isEmpty() && !name.toLowerCase(Locale.ROOT).contains(q) && !phone.contains(q) && !address.toLowerCase(Locale.ROOT).contains(q)) {
                continue;
            }
            filtered.add(c);
        }

        if (filtered.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("No customers match search criteria.");
            empty.setTextSize(13);
            empty.setTextColor(theme.colorTextMuted);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(0, dp(40), 0, dp(40));
            listHolder.addView(empty);
            return;
        }

        for (JSONObject c : filtered) {
            String cId = c.optString("id", "cust");
            String name = c.optString("name", "Customer");
            String phone = c.optString("phone", "");
            String address = c.optString("address", "N/A");
            int totalOrders = c.optInt("totalOrders", 0);
            double totalSpent = c.optDouble("totalSpent", 0);
            String favoriteDish = c.optString("favoriteDish", "");

            LinearLayout card = new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setBackgroundResource(theme.resCardBg);
            card.setPadding(dp(14), dp(14), dp(14), dp(14));
            LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            p.bottomMargin = dp(10);
            card.setLayoutParams(p);

            // Name + VIP Pill Row
            LinearLayout topRow = new LinearLayout(this);
            topRow.setOrientation(LinearLayout.HORIZONTAL);
            topRow.setGravity(Gravity.CENTER_VERTICAL);

            LinearLayout nBox = new LinearLayout(this);
            nBox.setOrientation(LinearLayout.VERTICAL);
            nBox.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            TextView nTv = new TextView(this);
            nTv.setText(name);
            nTv.setTextSize(15);
            nTv.setTypeface(null, Typeface.BOLD);
            nTv.setTextColor(theme.colorTextPrimary);
            nBox.addView(nTv);

            TextView idTv = new TextView(this);
            idTv.setText("ID: #" + cId);
            idTv.setTextSize(11);
            idTv.setTextColor(theme.colorTextMuted);
            nBox.addView(idTv);
            topRow.addView(nBox);

            if (totalOrders >= 5) {
                TextView vip = new TextView(this);
                vip.setText("★ VIP");
                vip.setTextSize(10);
                vip.setTypeface(null, Typeface.BOLD);
                vip.setTextColor(Color.parseColor("#F59E0B"));
                vip.setBackgroundResource(R.drawable.bg_pill_amber);
                vip.setPadding(dp(8), dp(3), dp(8), dp(3));
                topRow.addView(vip);
            }

            if (!phone.isEmpty()) {
                ImageView callBtn = new ImageView(this);
                callBtn.setImageResource(R.drawable.ic_call_line);
                callBtn.setImageTintList(ColorStateList.valueOf(Color.parseColor("#10B981")));
                callBtn.setBackgroundResource(theme.resOutlineBtn);
                callBtn.setPadding(dp(7), dp(7), dp(7), dp(7));
                LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(dp(32), dp(32));
                cp.leftMargin = dp(8);
                callBtn.setLayoutParams(cp);
                callBtn.setOnClickListener(v -> {
                    try {
                        Intent dial = new Intent(Intent.ACTION_DIAL);
                        dial.setData(Uri.parse("tel:" + phone));
                        startActivity(dial);
                    } catch (Exception ignored) {}
                });
                topRow.addView(callBtn);
            }
            card.addView(topRow);

            // Phone & Address
            TextView pTv = new TextView(this);
            pTv.setText("Phone: +91 " + phone);
            pTv.setTextSize(12);
            pTv.setTextColor(theme.colorTextSecondary);
            pTv.setPadding(0, dp(6), 0, dp(2));
            card.addView(pTv);

            TextView aTv = new TextView(this);
            aTv.setText("Address: " + address);
            aTv.setTextSize(12);
            aTv.setTextColor(theme.colorTextSecondary);
            card.addView(aTv);

            // Orders & Spend Row
            LinearLayout statRow = new LinearLayout(this);
            statRow.setOrientation(LinearLayout.HORIZONTAL);
            statRow.setPadding(0, dp(8), 0, 0);

            TextView oTv = new TextView(this);
            oTv.setText("Orders: " + totalOrders + "  •  Spent: ₹" + ((int) totalSpent));
            oTv.setTextSize(12);
            oTv.setTypeface(null, Typeface.BOLD);
            oTv.setTextColor(Color.parseColor("#10B981"));
            statRow.addView(oTv);
            card.addView(statRow);

            if (!favoriteDish.isEmpty()) {
                TextView fTv = new TextView(this);
                fTv.setText("Favorite: " + favoriteDish);
                fTv.setTextSize(11);
                fTv.setTextColor(theme.colorTextSecondary);
                fTv.setPadding(0, dp(2), 0, 0);
                card.addView(fTv);
            }

            listHolder.addView(card);
        }
    }

    // ==========================================
    // TAB 5: CUSTOMER REVIEWS & RATINGS
    // ==========================================

    private void renderReviewsTab() {
        LinearLayout container = tabContainers[5];
        container.removeAllViews();

        int totalReviews = SmsGatewayService.reviewsList.size();
        double avgRating = 0;
        int fiveStars = 0;
        int fourStars = 0;
        int lowStars = 0;

        for (JSONObject r : SmsGatewayService.reviewsList) {
            double rate = r.optDouble("rating", 5);
            avgRating += rate;
            if (rate >= 5) fiveStars++;
            else if (rate >= 4) fourStars++;
            else lowStars++;
        }
        if (totalReviews > 0) avgRating = avgRating / totalReviews;

        TextView title = new TextView(this);
        title.setText("CUSTOMER REVIEWS (" + totalReviews + ")");
        title.setTextSize(16);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(theme.colorTextPrimary);
        container.addView(title);

        TextView sub = new TextView(this);
        sub.setText(String.format(Locale.getDefault(), "Average Store Rating: %.1f ★", avgRating));
        sub.setTextSize(12);
        sub.setTextColor(Color.parseColor(theme.isDark ? "#F59E0B" : "#D97706"));
        sub.setPadding(0, dp(2), 0, dp(12));
        container.addView(sub);

        // KPI Row for reviews
        container.addView(createKpiRow("Average Rating", String.format(Locale.getDefault(), "%.1f ★", avgRating), "#F59E0B",
                "5-Star Superb", String.valueOf(fiveStars), "#10B981"));

        // Filter chips: ALL, 5 STARS, 4 STARS, 3 STARS
        LinearLayout filterRow = new LinearLayout(this);
        filterRow.setOrientation(LinearLayout.HORIZONTAL);
        filterRow.setPadding(0, dp(4), 0, dp(14));

        String[] filters = new String[] { "ALL", "5 STARS", "4 STARS", "3 STARS" };
        for (String f : filters) {
            final String fKey = f;
            TextView chip = new TextView(this);
            chip.setText(f);
            chip.setTextSize(11);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setPadding(dp(12), dp(6), dp(12), dp(6));

            boolean sel = currentReviewFilter.equals(fKey);
            if (sel) {
                chip.setBackgroundResource(R.drawable.bg_button_red);
                chip.setTextColor(Color.WHITE);
            } else {
                chip.setBackgroundResource(theme.resChipInactive);
                chip.setTextColor(theme.colorTextSecondary);
            }

            LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            p.rightMargin = dp(6);
            chip.setLayoutParams(p);
            chip.setOnClickListener(v -> {
                currentReviewFilter = fKey;
                renderReviewsTab();
            });
            filterRow.addView(chip);
        }
        container.addView(filterRow);

        List<JSONObject> filtered = new ArrayList<>();
        for (JSONObject r : SmsGatewayService.reviewsList) {
            int rate = (int) r.optDouble("rating", 5);
            if ("ALL".equals(currentReviewFilter)) filtered.add(r);
            else if ("5 STARS".equals(currentReviewFilter) && rate == 5) filtered.add(r);
            else if ("4 STARS".equals(currentReviewFilter) && rate == 4) filtered.add(r);
            else if ("3 STARS".equals(currentReviewFilter) && rate <= 3) filtered.add(r);
        }

        if (filtered.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("No reviews found in this category.");
            empty.setTextSize(13);
            empty.setTextColor(theme.colorTextMuted);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(0, dp(40), 0, dp(40));
            container.addView(empty);
            return;
        }

        for (JSONObject r : filtered) {
            String rId = r.optString("id");
            String rName = r.optString("name", "Customer");
            int rating = (int) r.optDouble("rating", 5);
            String comment = r.optString("comment", "");
            String dish = r.optString("dish", "");
            String date = r.optString("date", "Recently");

            LinearLayout card = new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setBackgroundResource(theme.resCardBg);
            card.setPadding(dp(14), dp(14), dp(14), dp(14));
            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.bottomMargin = dp(10);
            card.setLayoutParams(cp);

            // Header: Name + Rating + Delete
            LinearLayout hRow = new LinearLayout(this);
            hRow.setOrientation(LinearLayout.HORIZONTAL);
            hRow.setGravity(Gravity.CENTER_VERTICAL);

            LinearLayout leftH = new LinearLayout(this);
            leftH.setOrientation(LinearLayout.VERTICAL);
            leftH.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            TextView nTv = new TextView(this);
            nTv.setText(rName + " • " + rating + " ★");
            nTv.setTextSize(14);
            nTv.setTypeface(null, Typeface.BOLD);
            nTv.setTextColor(Color.parseColor("#F59E0B"));
            leftH.addView(nTv);

            TextView dTv = new TextView(this);
            dTv.setText(dish.isEmpty() ? date : (dish + " • " + date));
            dTv.setTextSize(11);
            dTv.setTextColor(theme.colorTextMuted);
            leftH.addView(dTv);
            hRow.addView(leftH);

            ImageView delBtn = new ImageView(this);
            delBtn.setImageResource(R.drawable.ic_trash_line);
            delBtn.setImageTintList(ColorStateList.valueOf(Color.parseColor("#EF4444")));
            delBtn.setBackgroundResource(theme.resOutlineBtn);
            delBtn.setPadding(dp(6), dp(6), dp(6), dp(6));
            delBtn.setLayoutParams(new LinearLayout.LayoutParams(dp(30), dp(30)));
            delBtn.setOnClickListener(v -> {
                createDialogBuilder()
                        .setTitle("Delete Review")
                        .setMessage("Delete review by " + rName + "?")
                        .setPositiveButton("Delete", (d, w) -> {
                            SmsGatewayService.sendDeleteReview(rId);
                            Toast.makeText(this, "Review deleted", Toast.LENGTH_SHORT).show();
                        })
                        .setNegativeButton("Cancel", null)
                        .show();
            });
            hRow.addView(delBtn);
            card.addView(hRow);

            if (!comment.isEmpty()) {
                TextView cTv = new TextView(this);
                cTv.setText("\"" + comment + "\"");
                cTv.setTextSize(13);
                cTv.setTextColor(theme.colorTextSecondary);
                cTv.setPadding(0, dp(8), 0, dp(2));
                card.addView(cTv);
            }

            container.addView(card);
        }
    }

    // ==========================================
    // TAB 6: SMS GATEWAY & TELEPHONY
    // ==========================================

    private void renderSmsTab() {
        LinearLayout container = tabContainers[6];
        container.removeAllViews();

        // SIM Telephony Card
        LinearLayout simCard = new LinearLayout(this);
        simCard.setOrientation(LinearLayout.VERTICAL);
        simCard.setBackgroundResource(theme.resCardBg);
        simCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        sp.bottomMargin = dp(14);
        simCard.setLayoutParams(sp);

        TextView simTitle = new TextView(this);
        simTitle.setText("SIM & HARDWARE TELEPHONY");
        simTitle.setTextSize(12);
        simTitle.setTypeface(null, Typeface.BOLD);
        simTitle.setTextColor(theme.colorTextMuted);
        simCard.addView(simTitle);

        TextView carrierTv = new TextView(this);
        carrierTv.setText(SmsGatewayService.getCarrierName(this));
        carrierTv.setTextSize(18);
        carrierTv.setTypeface(null, Typeface.BOLD);
        carrierTv.setTextColor(theme.colorTextPrimary);
        carrierTv.setPadding(0, dp(6), 0, dp(2));
        simCard.addView(carrierTv);

        TextView signalTv = new TextView(this);
        signalTv.setText("Active SIM • Standby for Customer OTPs & Bank UPI SMS");
        signalTv.setTextSize(12);
        signalTv.setTextColor(Color.parseColor("#10B981"));
        simCard.addView(signalTv);

        View div = new View(this);
        div.setBackgroundColor(theme.colorDivider);
        LinearLayout.LayoutParams dp1 = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1));
        dp1.setMargins(0, dp(12), 0, dp(12));
        div.setLayoutParams(dp1);
        simCard.addView(div);

        // Counter Row
        LinearLayout cRow = new LinearLayout(this);
        cRow.setOrientation(LinearLayout.HORIZONTAL);
        cRow.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout cLeft = new LinearLayout(this);
        cLeft.setOrientation(LinearLayout.VERTICAL);
        cLeft.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView cLbl = new TextView(this);
        cLbl.setText("Customer OTPs Dispatched Today");
        cLbl.setTextSize(11);
        cLbl.setTextColor(theme.colorTextSecondary);
        cLeft.addView(cLbl);

        TextView cVal = new TextView(this);
        cVal.setText(String.valueOf(SmsGatewayService.smsSentToday));
        cVal.setTextSize(22);
        cVal.setTypeface(null, Typeface.BOLD);
        cVal.setTextColor(theme.colorTextPrimary);
        cLeft.addView(cVal);
        cRow.addView(cLeft);

        TextView livePill = new TextView(this);
        livePill.setText("TUNNEL ACTIVE");
        livePill.setTextSize(10);
        livePill.setTypeface(null, Typeface.BOLD);
        livePill.setTextColor(Color.parseColor("#10B981"));
        livePill.setBackgroundResource(R.drawable.bg_pill_green);
        livePill.setPadding(dp(8), dp(4), dp(8), dp(4));
        cRow.addView(livePill);

        simCard.addView(cRow);
        container.addView(simCard);

        // Hardware Test SMS Card (ZERO Dummy Data: Empty Input!)
        LinearLayout testCard = new LinearLayout(this);
        testCard.setOrientation(LinearLayout.VERTICAL);
        testCard.setBackgroundResource(theme.resCardBg);
        testCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tp.bottomMargin = dp(14);
        testCard.setLayoutParams(tp);

        TextView testTitle = new TextView(this);
        testTitle.setText("HARDWARE SIM TEST");
        testTitle.setTextSize(12);
        testTitle.setTypeface(null, Typeface.BOLD);
        testTitle.setTextColor(theme.colorTextMuted);
        testCard.addView(testTitle);

        EditText phoneInput = new EditText(this);
        phoneInput.setText(""); // Clean empty input!
        phoneInput.setHint("Enter 10-digit mobile number");
        phoneInput.setInputType(InputType.TYPE_CLASS_PHONE);
        phoneInput.setTextColor(theme.colorInputText);
        phoneInput.setHintTextColor(theme.colorInputHint);
        phoneInput.setBackgroundResource(theme.resInputBg);
        phoneInput.setPadding(dp(12), dp(12), dp(12), dp(12));
        LinearLayout.LayoutParams pip = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        pip.setMargins(0, dp(8), 0, dp(10));
        phoneInput.setLayoutParams(pip);
        testCard.addView(phoneInput);

        Button testBtn = new Button(this);
        testBtn.setText("SEND TEST SMS VIA SIM");
        testBtn.setTextSize(13);
        testBtn.setTypeface(null, Typeface.BOLD);
        testBtn.setTextColor(Color.WHITE);
        testBtn.setBackgroundResource(R.drawable.bg_button_red);
        testBtn.setPadding(0, dp(12), 0, dp(12));
        testBtn.setOnClickListener(v -> {
            String target = phoneInput.getText().toString().trim();
            if (target.isEmpty() || target.length() < 10) {
                Toast.makeText(this, "Please enter valid 10-digit number", Toast.LENGTH_SHORT).show();
                return;
            }
            if (!target.startsWith("+91")) target = "+91" + target;
            SmsGatewayService.sendTestSms(this, target);
            Toast.makeText(this, "Test SMS dispatched via SIM to " + target, Toast.LENGTH_SHORT).show();
            renderSmsTab();
        });
        testCard.addView(testBtn);
        container.addView(testCard);

        // Bank SMS Live Log
        LinearLayout logCard = new LinearLayout(this);
        logCard.setOrientation(LinearLayout.VERTICAL);
        logCard.setBackgroundResource(theme.resCardBg);
        logCard.setPadding(dp(16), dp(16), dp(16), dp(16));

        TextView logTitle = new TextView(this);
        logTitle.setText("REAL-TIME BANK SMS VERIFICATION LOG");
        logTitle.setTextSize(12);
        logTitle.setTypeface(null, Typeface.BOLD);
        logTitle.setTextColor(theme.colorTextMuted);
        logCard.addView(logTitle);

        if (SmsGatewayService.smsLogs.isEmpty()) {
            TextView noLog = new TextView(this);
            noLog.setText("No SMS events recorded yet.");
            noLog.setTextSize(12);
            noLog.setTextColor(theme.colorTextMuted);
            noLog.setPadding(0, dp(12), 0, dp(12));
            logCard.addView(noLog);
        } else {
            for (String line : SmsGatewayService.smsLogs) {
                TextView item = new TextView(this);
                item.setText(line);
                item.setTextSize(12);
                item.setTypeface(Typeface.MONOSPACE);
                item.setTextColor(theme.colorTextSecondary);
                item.setPadding(0, dp(4), 0, dp(4));
                logCard.addView(item);
            }
        }
        container.addView(logCard);
    }

    // ==========================================
    // TAB 7: STORE SETTINGS & BRAND INFO
    // ==========================================

    private void renderSettingsTab() {
        LinearLayout container = tabContainers[7];
        container.removeAllViews();

        TextView title = new TextView(this);
        title.setText("DUKAN SETTINGS & BRAND INFO");
        title.setTextSize(16);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(theme.colorTextPrimary);
        container.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Manage merchant UPI, timings, address & customer-facing information");
        sub.setTextSize(11);
        sub.setTextColor(theme.colorTextSecondary);
        sub.setPadding(0, dp(2), 0, dp(14));
        container.addView(sub);

        // Active Store & Dukan Switcher Card
        LinearLayout storeCard = new LinearLayout(this);
        storeCard.setOrientation(LinearLayout.VERTICAL);
        storeCard.setBackgroundResource(theme.resCardBg);
        storeCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams storeCardLp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        storeCardLp.bottomMargin = dp(14);
        storeCard.setLayoutParams(storeCardLp);

        TextView scTitle = new TextView(this);
        scTitle.setText("🏪 ACTIVE DUKAN / STORE ID");
        scTitle.setTextSize(12);
        scTitle.setTypeface(null, Typeface.BOLD);
        scTitle.setTextColor(Color.parseColor("#DC2626"));
        storeCard.addView(scTitle);

        final String activeSid = SmsGatewayService.getConfiguredStoreId(this);
        TextView scSub = new TextView(this);
        scSub.setText("Connected Store: [" + activeSid + "] | Website & Orders synced to this ID");
        scSub.setTextSize(13);
        scSub.setTextColor(theme.colorTextSecondary);
        scSub.setPadding(0, dp(4), 0, dp(12));
        storeCard.addView(scSub);

        Button switchStoreBtn = new Button(this);
        switchStoreBtn.setText("🔄 SWITCH DUKAN / STORE ID (बदलें)");
        switchStoreBtn.setTextSize(13);
        switchStoreBtn.setTypeface(null, Typeface.BOLD);
        switchStoreBtn.setTextColor(Color.WHITE);
        switchStoreBtn.setBackgroundResource(R.drawable.bg_button_blue);
        switchStoreBtn.setPadding(0, dp(12), 0, dp(12));

        switchStoreBtn.setOnClickListener(v -> {
            AlertDialog.Builder b = new AlertDialog.Builder(this);
            b.setTitle("🏪 Switch Store / Dukan ID");
            b.setMessage("Enter the Store ID of the shop you want to manage (e.g. shawarma, pizza, fashion):");

            final EditText input = new EditText(this);
            input.setText(activeSid);
            input.setHint("store id (lowercase)");
            input.setPadding(dp(16), dp(12), dp(16), dp(12));
            b.setView(input);

            b.setPositiveButton("Switch & Connect", (diag, which) -> {
                String newSid = input.getText().toString().trim().toLowerCase();
                if (newSid.isEmpty()) newSid = "shawarma";
                SmsGatewayService.setConfiguredStoreId(MainActivity.this, newSid);
                Toast.makeText(MainActivity.this, "Switched to Store: " + newSid, Toast.LENGTH_SHORT).show();
                SmsGatewayService.triggerRefresh();
                renderSettingsTab();
            });
            b.setNegativeButton("Cancel", null);
            b.show();
        });

        storeCard.addView(switchStoreBtn);
        container.addView(storeCard);

        // Appearance & Display Theme Card
        LinearLayout themeCard = new LinearLayout(this);
        themeCard.setOrientation(LinearLayout.VERTICAL);
        themeCard.setBackgroundResource(theme.resCardBg);
        themeCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams tcp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tcp.bottomMargin = dp(14);
        themeCard.setLayoutParams(tcp);

        TextView tTitle = new TextView(this);
        tTitle.setText("APPEARANCE & DISPLAY THEME");
        tTitle.setTextSize(12);
        tTitle.setTypeface(null, Typeface.BOLD);
        tTitle.setTextColor(theme.colorTextMuted);
        themeCard.addView(tTitle);

        String currentPref = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getString("theme_mode", "SYSTEM");
        String currentDesc = "System Default (Following Phone — " + (theme.isDark ? "Dark Mode" : "Light Mode") + ")";
        if ("LIGHT".equals(currentPref)) currentDesc = "Always Light Mode";
        else if ("DARK".equals(currentPref)) currentDesc = "Always Dark Mode";

        TextView tSub = new TextView(this);
        tSub.setText("Active: " + currentDesc);
        tSub.setTextSize(13);
        tSub.setTextColor(theme.colorTextSecondary);
        tSub.setPadding(0, dp(4), 0, dp(10));
        themeCard.addView(tSub);

        Button changeThemeBtn = new Button(this);
        changeThemeBtn.setText("SWITCH THEME / FOLLOW PHONE");
        changeThemeBtn.setTextSize(13);
        changeThemeBtn.setTypeface(null, Typeface.BOLD);
        changeThemeBtn.setTextColor(Color.WHITE);
        changeThemeBtn.setBackgroundResource(R.drawable.bg_button_red);
        changeThemeBtn.setPadding(0, dp(12), 0, dp(12));
        changeThemeBtn.setOnClickListener(v -> showThemeDialog());
        container.addView(themeCard);

        // Server Connection & Wi-Fi IP Card
        LinearLayout serverCard = new LinearLayout(this);
        serverCard.setOrientation(LinearLayout.VERTICAL);
        serverCard.setBackgroundResource(theme.resCardBg);
        serverCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams scp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        scp.bottomMargin = dp(14);
        serverCard.setLayoutParams(scp);

        TextView sTitle = new TextView(this);
        sTitle.setText("SERVER CONNECTION & WI-FI IP");
        sTitle.setTextSize(12);
        sTitle.setTypeface(null, Typeface.BOLD);
        sTitle.setTextColor(theme.colorTextMuted);
        serverCard.addView(sTitle);

        TextView sDesc = new TextView(this);
        String serverStatusStr = SmsGatewayService.isConnected() ? "🟢 Connected | SIM Active" : "🟡 Retrying / Disconnected";
        sDesc.setText("Current Server IP: " + SmsGatewayService.getConfiguredServerIp(this) + "\nStatus: " + serverStatusStr);
        sDesc.setTextSize(13);
        sDesc.setTextColor(theme.colorTextSecondary);
        sDesc.setPadding(0, dp(4), 0, dp(10));
        serverCard.addView(sDesc);

        Button changeIpBtn = new Button(this);
        changeIpBtn.setText("CHANGE SERVER IP / RECONNECT");
        changeIpBtn.setTextSize(13);
        changeIpBtn.setTypeface(null, Typeface.BOLD);
        changeIpBtn.setTextColor(Color.WHITE);
        changeIpBtn.setBackgroundResource(R.drawable.bg_button_red);
        changeIpBtn.setPadding(0, dp(12), 0, dp(12));
        changeIpBtn.setOnClickListener(v -> showServerConfigDialog());
        serverCard.addView(changeIpBtn);

        container.addView(serverCard);

        
        // FREE DELIVERY THRESHOLD CARD
        addFreeDeliveryThresholdCard(container);

        // TAXES & CHARGES CARD (Dynamic GST & Packaging Controls)
        addTaxesAndChargesCard(container);

        JSONObject storeInfo = SmsGatewayService.storeInfoObj;
        JSONObject payment = storeInfo.optJSONObject("payment");
        JSONObject socials = storeInfo.optJSONObject("socials");

        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setBackgroundResource(theme.resCardBg);
        form.setPadding(dp(16), dp(16), dp(16), dp(16));
        container.addView(form);

        // UPI ID
        String upiVal = payment != null ? payment.optString("upiId", "") : SmsGatewayService.currentUpiId;
        EditText upiIn = createLabeledInput(form, "Merchant UPI ID (VPA)", upiVal);

        // Payee Name
        String payeeVal = payment != null ? payment.optString("payeeName", "Shawarma Nights") : "Shawarma Nights";
        EditText payeeIn = createLabeledInput(form, "UPI Payee Merchant Name", payeeVal);

        // Timings
        EditText timingIn = createLabeledInput(form, "Store Working Hours", storeInfo.optString("timing", "Open Daily: 12:00 PM – 04:00 AM"));

        // Address
        EditText addrIn = createLabeledInput(form, "Store Kitchen Address", storeInfo.optString("address", ""));

        // Delivery Note
        EditText delivIn = createLabeledInput(form, "Delivery Note", storeInfo.optString("deliveryNote", ""));

        // Halal Badge Text
        EditText halalIn = createLabeledInput(form, "Halal Badge Text", storeInfo.optString("halalBadgeText", "100% Halal Certified Fresh"));

        // About Description
        EditText aboutIn = createLabeledInput(form, "About Store", storeInfo.optString("aboutText", ""));

        // WhatsApp
        String waVal = socials != null ? socials.optString("whatsapp", "") : "";
        EditText waIn = createLabeledInput(form, "WhatsApp Contact Number", waVal);

        // Instagram
        String igVal = socials != null ? socials.optString("instagram", "") : "";
        EditText igIn = createLabeledInput(form, "Instagram Profile Link", igVal);

        Button saveBtn = new Button(this);
        saveBtn.setText("SAVE & SYNC TO SERVER");
        saveBtn.setTextSize(13);
        saveBtn.setTypeface(null, Typeface.BOLD);
        saveBtn.setTextColor(Color.WHITE);
        saveBtn.setBackgroundResource(R.drawable.bg_button_red);
        saveBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        sp.topMargin = dp(14);
        saveBtn.setLayoutParams(sp);
        saveBtn.setOnClickListener(v -> {
            try {
                JSONObject updated = new JSONObject();
                updated.put("timing", timingIn.getText().toString().trim());
                updated.put("address", addrIn.getText().toString().trim());
                updated.put("deliveryNote", delivIn.getText().toString().trim());
                updated.put("halalBadgeText", halalIn.getText().toString().trim());
                updated.put("aboutText", aboutIn.getText().toString().trim());

                JSONObject payObj = new JSONObject();
                payObj.put("upiId", upiIn.getText().toString().trim());
                payObj.put("payeeName", payeeIn.getText().toString().trim());
                payObj.put("autoSmsVerification", true);
                updated.put("payment", payObj);

                JSONObject socObj = new JSONObject();
                socObj.put("whatsapp", waIn.getText().toString().trim());
                socObj.put("instagram", igIn.getText().toString().trim());
                updated.put("socials", socObj);

                SmsGatewayService.sendUpdateStoreInfo(updated);
                Toast.makeText(this, "Store Info & UPI Saved and Synced!", Toast.LENGTH_SHORT).show();
            } catch (Exception ignored) {}
        });
        form.addView(saveBtn);

        // Kitchen Chime Alert Test Card
        LinearLayout chimeCard = new LinearLayout(this);
        chimeCard.setOrientation(LinearLayout.VERTICAL);
        chimeCard.setBackgroundResource(theme.resCardBg);
        chimeCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams ccp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        ccp.topMargin = dp(14);
        chimeCard.setLayoutParams(ccp);

        TextView cTitle = new TextView(this);
        cTitle.setText("KITCHEN ORDER CHIME AUDIO TEST");
        cTitle.setTextSize(12);
        cTitle.setTypeface(null, Typeface.BOLD);
        cTitle.setTextColor(theme.colorTextMuted);
        chimeCard.addView(cTitle);

        Button chimeBtn = new Button(this);
        chimeBtn.setText("TEST KITCHEN ALERT CHIME");
        chimeBtn.setTextSize(13);
        chimeBtn.setTypeface(null, Typeface.BOLD);
        chimeBtn.setTextColor(theme.colorTextPrimary);
        chimeBtn.setBackgroundResource(theme.resOutlineBtn);
        chimeBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams cbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        cbp.topMargin = dp(10);
        chimeBtn.setLayoutParams(cbp);
        chimeBtn.setOnClickListener(v -> {
            AudioAlertManager.testChime(this);
            Toast.makeText(this, "Ringing Kitchen Chime...", Toast.LENGTH_SHORT).show();
        });
        chimeCard.addView(chimeBtn);

        container.addView(chimeCard);

        // Dukandar Account Logout Card
        LinearLayout logoutCard = new LinearLayout(this);
        logoutCard.setOrientation(LinearLayout.VERTICAL);
        logoutCard.setBackgroundResource(theme.resCardBg);
        logoutCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams lcp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lcp.topMargin = dp(14);
        lcp.bottomMargin = dp(24);
        logoutCard.setLayoutParams(lcp);

        TextView lTitle = new TextView(this);
        lTitle.setText("🚪 DUKANDAR ACCOUNT ACCESS");
        lTitle.setTextSize(12);
        lTitle.setTypeface(null, Typeface.BOLD);
        lTitle.setTextColor(theme.colorTextMuted);
        logoutCard.addView(lTitle);

        String currentAdminUser = getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getString("admin_username", "Master Admin");
        TextView lDesc = new TextView(this);
        lDesc.setText("Logged in as: " + currentAdminUser + "\nIs device se logout karne ke baad kisi bhi phone se Master Password ke sath login kiya ja sakta hai.");
        lDesc.setTextSize(12);
        lDesc.setTextColor(theme.colorTextSecondary);
        lDesc.setPadding(0, dp(4), 0, dp(12));
        logoutCard.addView(lDesc);

        Button logoutBtn = new Button(this);
        logoutBtn.setText("🚪 LOGOUT DUKANDAR ACCOUNT");
        logoutBtn.setTextSize(13);
        logoutBtn.setTypeface(null, Typeface.BOLD);
        logoutBtn.setTextColor(Color.WHITE);
        logoutBtn.setBackgroundResource(R.drawable.bg_button_red);
        logoutBtn.setPadding(0, dp(12), 0, dp(12));
        logoutBtn.setOnClickListener(v -> {
            createDialogBuilder()
                    .setTitle("Logout Confirmation")
                    .setMessage("Kya aap Dukandar Portal se logout karna chahte hain?")
                    .setPositiveButton("Logout", (dialog, which) -> {
                        getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit()
                                .putBoolean("is_admin_logged_in", false)
                                .apply();
                        Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show();
                        checkAuthAndDisplay();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        });
        logoutCard.addView(logoutBtn);

        container.addView(logoutCard);
    }

    
    private void showTooltip(String title, String message) {
        createDialogBuilder()
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show();
    }

    
    private HorizontalScrollView createChipGroup(String[] options, String[] values, String currentVal, EditText targetInput) {
        HorizontalScrollView hsv = new HorizontalScrollView(this);
        hsv.setHorizontalScrollBarEnabled(false);
        
        LinearLayout group = new LinearLayout(this);
        group.setOrientation(LinearLayout.HORIZONTAL);
        group.setPadding(0, dp(4), 0, dp(10));
        
        final List<TextView> chips = new ArrayList<>();
        
        for (int i = 0; i < options.length; i++) {
            final String optText = options[i];
            final String optVal = values[i];
            
            TextView chip = new TextView(this);
            chip.setText(optText);
            chip.setTextSize(12);
            chip.setPadding(dp(12), dp(6), dp(12), dp(6));
            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.rightMargin = dp(8);
            chip.setLayoutParams(cp);
            
            if (optVal.equals(currentVal) || optText.equals(currentVal)) {
                chip.setBackgroundResource(R.drawable.bg_button_red);
                chip.setTextColor(Color.WHITE);
                targetInput.setText(optVal);
            } else {
                chip.setBackgroundResource(theme.resOutlineBtn);
                chip.setTextColor(theme.colorTextPrimary);
            }
            
            chip.setOnClickListener(v -> {
                targetInput.setText(optVal);
                for (TextView c : chips) {
                    c.setBackgroundResource(theme.resOutlineBtn);
                    c.setTextColor(theme.colorTextPrimary);
                }
                chip.setBackgroundResource(R.drawable.bg_button_red);
                chip.setTextColor(Color.WHITE);
            });
            
            chips.add(chip);
            group.addView(chip);
        }
        hsv.addView(group);
        return hsv;
    }

    private EditText createLabeledInput(LinearLayout parent, String label, String value) {
        TextView lbl = new TextView(this);
        lbl.setText(label);
        lbl.setTextSize(11);
        lbl.setTypeface(null, Typeface.BOLD);
        lbl.setTextColor(theme.colorTextSecondary);
        lbl.setPadding(0, dp(8), 0, dp(4));
        parent.addView(lbl);

        EditText input = new EditText(this);
        input.setText(value);
        input.setTextColor(theme.colorInputText);
        input.setHintTextColor(theme.colorInputHint);
        input.setTextSize(13);
        input.setBackgroundResource(theme.resInputBg);
        input.setPadding(dp(12), dp(10), dp(12), dp(10));
        parent.addView(input);
        return input;
    }

    private void addFreeDeliveryThresholdCard(LinearLayout container) {
        LinearLayout fdCard = new LinearLayout(this);
        fdCard.setOrientation(LinearLayout.VERTICAL);
        fdCard.setBackgroundResource(theme.resCardBg);
        fdCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams fdcp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        fdcp.bottomMargin = dp(14);
        fdCard.setLayoutParams(fdcp);

        TextView fdTitle = new TextView(this);
        fdTitle.setText("🚚 FREE DELIVERY THRESHOLD (फ्री डिलीवरी लिमिट)");
        fdTitle.setTextSize(13);
        fdTitle.setTypeface(null, Typeface.BOLD);
        fdTitle.setTextColor(Color.parseColor("#DC2626"));
        fdCard.addView(fdTitle);
        
        JSONObject currentStoreInfo = SmsGatewayService.storeInfoObj;
        double currentThreshold = currentStoreInfo != null ? currentStoreInfo.optDouble("freeDeliveryThreshold", 350.0) : 350.0;

        TextView fdSub = new TextView(this);
        fdSub.setText("Current Limit: ₹" + (int)currentThreshold + " (Customer ke bag me is amount se upar delivery FREE hogi)");
        fdSub.setTextSize(12);
        fdSub.setTextColor(theme.colorTextSecondary);
        fdSub.setPadding(0, dp(4), 0, dp(10));
        fdCard.addView(fdSub);
        
        EditText fdCustom = new EditText(this);
        fdCustom.setText(String.valueOf((int)currentThreshold));
        fdCustom.setHint("Custom Amount (e.g. 350)");
        fdCustom.setInputType(InputType.TYPE_CLASS_NUMBER);
        fdCustom.setTextColor(theme.colorInputText);
        fdCustom.setBackgroundResource(theme.resInputBg);
        fdCustom.setPadding(dp(12), dp(10), dp(12), dp(10));
        
        HorizontalScrollView fdScroll = new HorizontalScrollView(this);
        fdScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout fdChips = new LinearLayout(this);
        fdChips.setOrientation(LinearLayout.HORIZONTAL);
        fdChips.setPadding(0, 0, 0, dp(10));
        
        int[] threshVals = {199, 249, 299, 349, 399, 499};
        for(int tv : threshVals) {
            TextView chip = new TextView(this);
            chip.setText("₹" + tv);
            chip.setTextSize(12);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setPadding(dp(12), dp(6), dp(12), dp(6));
            chip.setBackgroundResource(theme.resOutlineBtn);
            chip.setTextColor(theme.colorTextPrimary);
            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.rightMargin = dp(8);
            chip.setLayoutParams(cp);
            chip.setOnClickListener(v -> fdCustom.setText(String.valueOf(tv)));
            fdChips.addView(chip);
        }
        fdScroll.addView(fdChips);
        fdCard.addView(fdScroll);
        fdCard.addView(fdCustom);
        
        Button saveFdBtn = new Button(this);
        saveFdBtn.setText("SAVE THRESHOLD (वेबसाइट पर सेव करें)");
        saveFdBtn.setTextSize(13);
        saveFdBtn.setTypeface(null, Typeface.BOLD);
        saveFdBtn.setTextColor(Color.WHITE);
        saveFdBtn.setBackgroundResource(R.drawable.bg_button_red);
        saveFdBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams sfdbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        sfdbp.topMargin = dp(10);
        saveFdBtn.setLayoutParams(sfdbp);
        saveFdBtn.setOnClickListener(v -> {
            try {
                String val = fdCustom.getText().toString().trim();
                double nVal = val.isEmpty() ? 0 : Double.parseDouble(val);
                JSONObject updated = new JSONObject();
                updated.put("freeDeliveryThreshold", nVal);
                SmsGatewayService.sendUpdateStoreInfo(updated);
                Toast.makeText(this, "Free Delivery Limit ₹" + (int)nVal + " Saved & Synced!", Toast.LENGTH_SHORT).show();
                fdSub.setText("Current Limit: ₹" + (int)nVal + " (Customer ke bag me is amount se upar delivery FREE hogi)");
            } catch (Exception ignored) {}
        });
        fdCard.addView(saveFdBtn);
        container.addView(fdCard);
    }

    private void addTaxesAndChargesCard(LinearLayout container) {
        LinearLayout tcCard = new LinearLayout(this);
        tcCard.setOrientation(LinearLayout.VERTICAL);
        tcCard.setBackgroundResource(theme.resCardBg);
        tcCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams tcp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tcp.bottomMargin = dp(14);
        tcCard.setLayoutParams(tcp);

        // Title: "🏛️ TAXES & CHARGES (टैक्स व पैकेजिंग चार्ज)" in bold red #DC2626
        TextView tcTitle = new TextView(this);
        tcTitle.setText("🏛️ TAXES & CHARGES (टैक्स व पैकेजिंग चार्ज)");
        tcTitle.setTextSize(13);
        tcTitle.setTypeface(null, Typeface.BOLD);
        tcTitle.setTextColor(Color.parseColor("#DC2626"));
        tcCard.addView(tcTitle);

        // Subtitle
        TextView tcSub = new TextView(this);
        tcSub.setText("Customer se GST Tax ya Packaging Charge lena hai ya nahi yahan se on/off aur set karein.");
        tcSub.setTextSize(12);
        tcSub.setTextColor(theme.colorTextSecondary);
        tcSub.setPadding(0, dp(4), 0, dp(8));
        tcCard.addView(tcSub);

        // Fetch current store settings
        JSONObject currentStoreInfo = SmsGatewayService.storeInfoObj;
        JSONObject tcObj = currentStoreInfo != null ? currentStoreInfo.optJSONObject("taxesAndCharges") : null;
        boolean initialEnabled = tcObj != null && tcObj.optBoolean("enabled", false);
        double initialTaxPercent = tcObj != null ? tcObj.optDouble("taxPercent", 0.0) : 0.0;
        double initialPackaging = tcObj != null ? tcObj.optDouble("packagingCharge", 0.0) : 0.0;

        final boolean[] isTaxEnabled = new boolean[]{ initialEnabled };

        // Status TextView
        TextView tcStatus = new TextView(this);
        tcStatus.setTextSize(12);
        tcStatus.setTypeface(null, Typeface.BOLD);
        tcStatus.setPadding(0, dp(2), 0, dp(10));
        tcCard.addView(tcStatus);

        // Toggle Chips: [ 🔴 OFF (टैक्स बंद) ] [ 🟢 ON (टैक्स चालू) ]
        TextView toggleLbl = new TextView(this);
        toggleLbl.setText("Tax & Charges Status:");
        toggleLbl.setTextSize(11);
        toggleLbl.setTextColor(theme.colorTextSecondary);
        toggleLbl.setPadding(0, 0, 0, dp(4));
        tcCard.addView(toggleLbl);

        HorizontalScrollView toggleScroll = new HorizontalScrollView(this);
        toggleScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout toggleChips = new LinearLayout(this);
        toggleChips.setOrientation(LinearLayout.HORIZONTAL);
        toggleChips.setPadding(0, 0, 0, dp(10));

        TextView offChip = new TextView(this);
        offChip.setText("🔴 OFF (टैक्स बंद)");
        offChip.setTextSize(12);
        offChip.setTypeface(null, Typeface.BOLD);
        offChip.setPadding(dp(14), dp(8), dp(14), dp(8));
        LinearLayout.LayoutParams offP = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        offP.rightMargin = dp(8);
        offChip.setLayoutParams(offP);

        TextView onChip = new TextView(this);
        onChip.setText("🟢 ON (टैक्स चालू)");
        onChip.setTextSize(12);
        onChip.setTypeface(null, Typeface.BOLD);
        onChip.setPadding(dp(14), dp(8), dp(14), dp(8));
        LinearLayout.LayoutParams onP = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        onChip.setLayoutParams(onP);

        toggleChips.addView(offChip);
        toggleChips.addView(onChip);
        toggleScroll.addView(toggleChips);
        tcCard.addView(toggleScroll);

        // Tax % Chips & Input: [ 0% ] [ 5% GST ] [ 12% ] [ 18% ] [ Custom % ]
        TextView taxLbl = new TextView(this);
        taxLbl.setText("GST / Tax Percentage (%):");
        taxLbl.setTextSize(11);
        taxLbl.setTextColor(theme.colorTextSecondary);
        taxLbl.setPadding(0, dp(4), 0, dp(4));
        tcCard.addView(taxLbl);

        HorizontalScrollView taxScroll = new HorizontalScrollView(this);
        taxScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout taxChips = new LinearLayout(this);
        taxChips.setOrientation(LinearLayout.HORIZONTAL);
        taxChips.setPadding(0, 0, 0, dp(8));

        EditText taxCustom = new EditText(this);
        taxCustom.setText(initialTaxPercent == (long)initialTaxPercent ? String.valueOf((long)initialTaxPercent) : String.valueOf(initialTaxPercent));
        taxCustom.setHint("Tax % (e.g. 5)");
        taxCustom.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
        taxCustom.setTextColor(theme.colorInputText);
        taxCustom.setBackgroundResource(theme.resInputBg);
        taxCustom.setPadding(dp(12), dp(10), dp(12), dp(10));

        final List<TextView> taxChipViews = new ArrayList<>();
        String[] taxLabels = {"0%", "5% GST", "12%", "18%", "Custom %"};
        String[] taxVals = {"0", "5", "12", "18", ""};

        for (int i = 0; i < taxLabels.length; i++) {
            final String tLabel = taxLabels[i];
            final String tVal = taxVals[i];
            TextView chip = new TextView(this);
            chip.setText(tLabel);
            chip.setTextSize(12);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setPadding(dp(12), dp(6), dp(12), dp(6));
            chip.setBackgroundResource(theme.resOutlineBtn);
            chip.setTextColor(theme.colorTextPrimary);
            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.rightMargin = dp(8);
            chip.setLayoutParams(cp);

            chip.setOnClickListener(v -> {
                if (!tVal.isEmpty()) {
                    taxCustom.setText(tVal);
                } else {
                    taxCustom.requestFocus();
                }
                for (TextView cv : taxChipViews) {
                    cv.setBackgroundResource(theme.resOutlineBtn);
                    cv.setTextColor(theme.colorTextPrimary);
                }
                chip.setBackgroundResource(R.drawable.bg_button_red);
                chip.setTextColor(Color.WHITE);
            });
            taxChipViews.add(chip);
            taxChips.addView(chip);
        }
        taxScroll.addView(taxChips);
        tcCard.addView(taxScroll);
        tcCard.addView(taxCustom);

        // Extra Packaging Charge Chips & Input: [ ₹0 ] [ ₹10 ] [ ₹20 ] [ ₹30 ] [ Custom ₹ ]
        TextView packLbl = new TextView(this);
        packLbl.setText("Extra Packaging Charge (₹):");
        packLbl.setTextSize(11);
        packLbl.setTextColor(theme.colorTextSecondary);
        packLbl.setPadding(0, dp(8), 0, dp(4));
        tcCard.addView(packLbl);

        HorizontalScrollView packScroll = new HorizontalScrollView(this);
        packScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout packChips = new LinearLayout(this);
        packChips.setOrientation(LinearLayout.HORIZONTAL);
        packChips.setPadding(0, 0, 0, dp(8));

        EditText packCustom = new EditText(this);
        packCustom.setText(initialPackaging == (long)initialPackaging ? String.valueOf((long)initialPackaging) : String.valueOf(initialPackaging));
        packCustom.setHint("Packaging ₹ (e.g. 10)");
        packCustom.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
        packCustom.setTextColor(theme.colorInputText);
        packCustom.setBackgroundResource(theme.resInputBg);
        packCustom.setPadding(dp(12), dp(10), dp(12), dp(10));

        final List<TextView> packChipViews = new ArrayList<>();
        String[] packLabels = {"₹0", "₹10", "₹20", "₹30", "Custom ₹"};
        String[] packVals = {"0", "10", "20", "30", ""};

        for (int i = 0; i < packLabels.length; i++) {
            final String pLabel = packLabels[i];
            final String pVal = packVals[i];
            TextView chip = new TextView(this);
            chip.setText(pLabel);
            chip.setTextSize(12);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setPadding(dp(12), dp(6), dp(12), dp(6));
            chip.setBackgroundResource(theme.resOutlineBtn);
            chip.setTextColor(theme.colorTextPrimary);
            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.rightMargin = dp(8);
            chip.setLayoutParams(cp);

            chip.setOnClickListener(v -> {
                if (!pVal.isEmpty()) {
                    packCustom.setText(pVal);
                } else {
                    packCustom.requestFocus();
                }
                for (TextView cv : packChipViews) {
                    cv.setBackgroundResource(theme.resOutlineBtn);
                    cv.setTextColor(theme.colorTextPrimary);
                }
                chip.setBackgroundResource(R.drawable.bg_button_red);
                chip.setTextColor(Color.WHITE);
            });
            packChipViews.add(chip);
            packChips.addView(chip);
        }
        packScroll.addView(packChips);
        tcCard.addView(packScroll);
        tcCard.addView(packCustom);

        // Status update logic
        Runnable updateStatusAndToggles = () -> {
            if (isTaxEnabled[0]) {
                onChip.setBackgroundResource(R.drawable.bg_button_red);
                onChip.setTextColor(Color.WHITE);
                offChip.setBackgroundResource(theme.resOutlineBtn);
                offChip.setTextColor(theme.colorTextPrimary);

                String tpStr = taxCustom.getText().toString().trim();
                String pcStr = packCustom.getText().toString().trim();
                double tp = 0;
                double pc = 0;
                try { if (!tpStr.isEmpty()) tp = Double.parseDouble(tpStr); } catch (Exception ignored) {}
                try { if (!pcStr.isEmpty()) pc = Double.parseDouble(pcStr); } catch (Exception ignored) {}

                StringBuilder sb = new StringBuilder("Status: 🟢 ON (");
                if (tp > 0) {
                    sb.append(tp == (long)tp ? String.format("%d", (long)tp) : String.valueOf(tp)).append("% GST");
                } else {
                    sb.append("0% Tax");
                }
                if (pc > 0) {
                    sb.append(" + ₹").append(pc == (long)pc ? String.format("%d", (long)pc) : String.valueOf(pc)).append(" Pack");
                }
                sb.append(")");
                tcStatus.setText(sb.toString());
                tcStatus.setTextColor(Color.parseColor("#10B981"));
            } else {
                offChip.setBackgroundResource(R.drawable.bg_button_red);
                offChip.setTextColor(Color.WHITE);
                onChip.setBackgroundResource(theme.resOutlineBtn);
                onChip.setTextColor(theme.colorTextPrimary);

                tcStatus.setText("Status: 🔴 OFF (बिल में नहीं जुड़ेगा)");
                tcStatus.setTextColor(Color.parseColor("#EF4444"));
            }
        };

        offChip.setOnClickListener(v -> {
            isTaxEnabled[0] = false;
            updateStatusAndToggles.run();
        });

        onChip.setOnClickListener(v -> {
            isTaxEnabled[0] = true;
            updateStatusAndToggles.run();
        });

        android.text.TextWatcher watcher = new android.text.TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(android.text.Editable s) {
                updateStatusAndToggles.run();
            }
        };
        taxCustom.addTextChangedListener(watcher);
        packCustom.addTextChangedListener(watcher);

        // Highlight matching initial chips
        for (int i = 0; i < taxVals.length - 1; i++) {
            if (taxVals[i].equals(taxCustom.getText().toString().trim())) {
                taxChipViews.get(i).setBackgroundResource(R.drawable.bg_button_red);
                taxChipViews.get(i).setTextColor(Color.WHITE);
                break;
            }
        }
        for (int i = 0; i < packVals.length - 1; i++) {
            if (packVals[i].equals(packCustom.getText().toString().trim())) {
                packChipViews.get(i).setBackgroundResource(R.drawable.bg_button_red);
                packChipViews.get(i).setTextColor(Color.WHITE);
                break;
            }
        }

        updateStatusAndToggles.run();

        // SAVE BUTTON: "SAVE TAX SETTINGS (वेबसाइट पर सेव करें)"
        Button saveTcBtn = new Button(this);
        saveTcBtn.setText("SAVE TAX SETTINGS (वेबसाइट पर सेव करें)");
        saveTcBtn.setTextSize(13);
        saveTcBtn.setTypeface(null, Typeface.BOLD);
        saveTcBtn.setTextColor(Color.WHITE);
        saveTcBtn.setBackgroundResource(R.drawable.bg_button_red);
        saveTcBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams stcbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        stcbp.topMargin = dp(12);
        saveTcBtn.setLayoutParams(stcbp);
        saveTcBtn.setOnClickListener(v -> {
            try {
                String tpStr = taxCustom.getText().toString().trim();
                String pcStr = packCustom.getText().toString().trim();
                double taxPercentVal = tpStr.isEmpty() ? 0.0 : Double.parseDouble(tpStr);
                double packagingChargeVal = pcStr.isEmpty() ? 0.0 : Double.parseDouble(pcStr);

                JSONObject tc = new JSONObject();
                tc.put("enabled", isTaxEnabled[0]);
                tc.put("taxPercent", taxPercentVal);
                tc.put("packagingCharge", packagingChargeVal);

                JSONObject updated = new JSONObject();
                updated.put("taxesAndCharges", tc);

                SmsGatewayService.sendUpdateStoreInfo(updated);
                if (SmsGatewayService.storeInfoObj != null) {
                    SmsGatewayService.storeInfoObj.put("taxesAndCharges", tc);
                }

                updateStatusAndToggles.run();
                Toast.makeText(this, "Tax & Charges settings saved and synced to website!", Toast.LENGTH_SHORT).show();
            } catch (Exception ex) {
                Toast.makeText(this, "Error: " + ex.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
        tcCard.addView(saveTcBtn);

        container.addView(tcCard);
    }

    // ==========================================
    // ==========================================
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
                Pattern pMap = Pattern.compile("maps\\.google\\.com/\\?q=([0-9.-]+),([0-9.-]+)");
                Matcher mMap = pMap.matcher(addr);
                if (mMap.find()) {
                    return new GeoCoord(Double.parseDouble(mMap.group(1)), Double.parseDouble(mMap.group(2)));
                }
            } catch (Exception ignored) {}

            try {
                Pattern pGps = Pattern.compile("GPS:\\s*([0-9.-]+),\\s*([0-9.-]+)");
                Matcher mGps = pGps.matcher(addr);
                if (mGps.find()) {
                    return new GeoCoord(Double.parseDouble(mGps.group(1)), Double.parseDouble(mGps.group(2)));
                }
            } catch (Exception ignored) {}

            try {
                Pattern pGen = Pattern.compile("([0-9]{1,3}\\.[0-9]{4,})\\s*,\\s*([0-9]{1,3}\\.[0-9]{4,})");
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

        // 1. Server Cloud Status Badge
        TextView ipBadge = new TextView(this);
        ipBadge.setText("☁️ ChuruOne Smart Cloud (Render Live)");
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

                        JSONObject resp = sendJsonHttpRequestWithCandidateFallback("/api/delivery/login", "POST", payload);

                        String token = resp.optString("token", "");
                        JSONObject boy = resp.optJSONObject("boy");
                        
                        if (boy == null && !token.isEmpty()) {
                            JSONObject statusResp = sendJsonHttpRequestWithCandidateFallback("/api/delivery/status?token=" + token, "GET", null);
                            boy = statusResp.optJSONObject("deliveryBoy");
                        }

                        String bId = boy != null ? boy.optString("id", "db-1") : "db-1";
                        String bName = boy != null ? boy.optString("name", "Rider") : "Rider";
                        String bPhone = boy != null ? boy.optString("phone", phone) : phone;
                        String bVehicle = boy != null ? boy.optString("vehicle", "Two-Wheeler") : "Two-Wheeler";

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

                        JSONObject resp = sendJsonHttpRequestWithCandidateFallback("/api/delivery/register", "POST", payload);

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
            JSONObject result = null;
            String foundBase = null;
            String lastErr = null;

            try {
                result = sendJsonHttpRequestWithCandidateFallback("/api/admin/status", "GET", null);
                foundBase = activeApiBase;
            } catch (Exception e) {
                lastErr = e.getMessage();
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
        ipBadge.setText("☁️ ChuruOne Smart Cloud (Render Live)");
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
        errHead.setText("☁️ CLOUD SE SAMPARK HO RAHA HAI...");
        errHead.setTextSize(14);
        errHead.setTypeface(null, Typeface.BOLD);
        errHead.setTextColor(Color.parseColor("#EF4444"));
        card.addView(errHead);

        TextView errSub = new TextView(this);
        errSub.setText("ChuruOne Live Cloud Server (churuone-backend.onrender.com) se connect hone me deri ho rahi hai.\n\nKripya phone ka internet/Wi-Fi check karein aur niche Retry dabayein.");
        errSub.setTextSize(12);
        errSub.setTextColor(theme.colorTextSecondary);
        errSub.setPadding(0, dp(8), 0, dp(16));
        card.addView(errSub);

        Button retryBtn = new Button(this);
        retryBtn.setText("🔄 RETRY CONNECT TO CLOUD");
        retryBtn.setTextSize(13);
        retryBtn.setTypeface(null, Typeface.BOLD);
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setBackgroundResource(R.drawable.bg_button_red);
        retryBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams rbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
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

            String currStore = SmsGatewayService.getConfiguredStoreId(this);
            EditText storeIdIn = createLabeledInput(card, "STORE ID / DUKAN CODE (UNIQUE, NO SPACES)", currStore);
            storeIdIn.setHint("e.g. shawarma, pizza, fashion");

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
                String targetSid = storeIdIn.getText().toString().trim().toLowerCase();
                if (targetSid.isEmpty()) targetSid = "shawarma";
                final String sId = targetSid;
                SmsGatewayService.setConfiguredStoreId(MainActivity.this, sId);

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

                        JSONObject resp = sendJsonHttpRequestWithCandidateFallback("/api/admin/setup", "POST", payload);

                        runOnUiThread(() -> {
                            getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit()
                                    .putBoolean("is_admin_logged_in", true)
                                    .putBoolean("is_delivery_logged_in", false)
                                    .putString("user_role", "dukandar")
                                    .putString("store_id", sId)
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

            String currStore = SmsGatewayService.getConfiguredStoreId(this);
            EditText loginStoreIn = createLabeledInput(card, "STORE ID / DUKAN CODE", currStore);
            loginStoreIn.setHint("e.g. shawarma, pizza (default: shawarma)");

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
                String inputStore = loginStoreIn.getText().toString().trim().toLowerCase();
                if (inputStore.isEmpty()) inputStore = "shawarma";
                final String sId = inputStore;
                SmsGatewayService.setConfiguredStoreId(MainActivity.this, sId);

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

                        JSONObject resp = sendJsonHttpRequestWithCandidateFallback("/api/admin/login", "POST", payload);

                        runOnUiThread(() -> {
                            String returnedUser = resp.optString("username", uName);
                            String returnedDukan = resp.optString("dukanName", "Shawarma Nights");
                            getSharedPreferences("dukandar_prefs", MODE_PRIVATE).edit()
                                    .putBoolean("is_admin_logged_in", true)
                                    .putBoolean("is_delivery_logged_in", false)
                                    .putString("user_role", "dukandar")
                                    .putString("store_id", sId)
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
            emptySub.setText("Sabhi orders deliver ho chuke hain ya kitchen se dispatch hone ka intezaar hai.\nAap online hain — naya order aate hi turant yahan live update hoga!");
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

            Button delivBtn = new Button(this);
            delivBtn.setText("🔐 VERIFY OTP & COMPLETE DELIVERY (ग्राहक OTP डालें)");
            delivBtn.setTextSize(12);
            delivBtn.setTypeface(null, Typeface.BOLD);
            delivBtn.setTextColor(Color.WHITE);
            delivBtn.setBackgroundResource(R.drawable.bg_button_green);
            delivBtn.setPadding(0, dp(12), 0, dp(12));
            LinearLayout.LayoutParams dbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            dbp.topMargin = dp(8);
            delivBtn.setLayoutParams(dbp);
            delivBtn.setOnClickListener(v -> showDeliveryOtpDialog(order, isPaid, total, orderId));
            card.addView(delivBtn);
        } else if ("out_for_delivery".equals(status) || "out".equals(status)) {
            Button delivBtn = new Button(this);
            delivBtn.setText("🔐 VERIFY OTP & DELIVER (डिलीवरी पूरी करें)");
            delivBtn.setTextSize(14);
            delivBtn.setTypeface(null, Typeface.BOLD);
            delivBtn.setTextColor(Color.WHITE);
            delivBtn.setBackgroundResource(R.drawable.bg_button_green);
            delivBtn.setPadding(0, dp(15), 0, dp(15));
            delivBtn.setOnClickListener(v -> showDeliveryOtpDialog(order, isPaid, total, orderId));
            card.addView(delivBtn);
        }

        return card;
    }

    private void showDeliveryOtpDialog(JSONObject order, boolean isPaid, double total, String orderId) {
        ScrollView sv = new ScrollView(this);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundResource(theme.resCardBg);
        layout.setPadding(dp(22), dp(20), dp(22), dp(20));
        sv.addView(layout);

        TextView title = new TextView(this);
        title.setText("🔐 DELIVERY CONFIRMATION OTP");
        title.setTextSize(15);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(Color.parseColor("#10B981"));
        layout.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Order #" + orderId + " customer ko deliver karne ke baad unse 4-digit Delivery OTP lekar yahan enter karein.");
        sub.setTextSize(12);
        sub.setTextColor(theme.colorTextSecondary);
        sub.setPadding(0, dp(4), 0, dp(14));
        layout.addView(sub);

        CheckBox cashConfirmCb = null;
        if (!isPaid) {
            LinearLayout codBox = new LinearLayout(this);
            codBox.setOrientation(LinearLayout.VERTICAL);
            codBox.setBackgroundResource(R.drawable.bg_pill_amber);
            codBox.setPadding(dp(14), dp(10), dp(14), dp(10));
            LinearLayout.LayoutParams cbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cbp.bottomMargin = dp(14);
            codBox.setLayoutParams(cbp);

            TextView codHead = new TextView(this);
            codHead.setText("💵 CASH ON DELIVERY: ₹" + ((int) total));
            codHead.setTextSize(13);
            codHead.setTypeface(null, Typeface.BOLD);
            codHead.setTextColor(Color.parseColor("#B45309"));
            codBox.addView(codHead);

            cashConfirmCb = new CheckBox(this);
            cashConfirmCb.setText("Haan, customer se ₹" + ((int) total) + " Cash le liya hai.");
            cashConfirmCb.setTextSize(12);
            cashConfirmCb.setTypeface(null, Typeface.BOLD);
            cashConfirmCb.setTextColor(Color.parseColor("#92400E"));
            cashConfirmCb.setPadding(dp(8), 0, 0, 0);
            codBox.addView(cashConfirmCb);

            layout.addView(codBox);
        }

        TextView otpLabel = new TextView(this);
        otpLabel.setText("CUSTOMER DELIVERY OTP (4 DIGITS)");
        otpLabel.setTextSize(11);
        otpLabel.setTypeface(null, Typeface.BOLD);
        otpLabel.setTextColor(theme.colorTextMuted);
        layout.addView(otpLabel);

        EditText otpIn = new EditText(this);
        otpIn.setInputType(InputType.TYPE_CLASS_NUMBER);
        otpIn.setHint("• • • •");
        otpIn.setHintTextColor(Color.parseColor("#64748B"));
        otpIn.setTextColor(Color.WHITE);
        otpIn.setTextSize(24);
        otpIn.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        otpIn.setGravity(Gravity.CENTER);
        otpIn.setBackgroundResource(theme.resInputBg);
        otpIn.setPadding(dp(16), dp(14), dp(16), dp(14));
        otpIn.setFilters(new InputFilter[]{ new InputFilter.LengthFilter(6) });
        LinearLayout.LayoutParams op = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        op.topMargin = dp(6);
        op.bottomMargin = dp(12);
        otpIn.setLayoutParams(op);
        layout.addView(otpIn);

        TextView errTv = new TextView(this);
        errTv.setVisibility(View.GONE);
        errTv.setTextColor(Color.parseColor("#EF4444"));
        errTv.setTextSize(12);
        errTv.setTypeface(null, Typeface.BOLD);
        errTv.setBackgroundResource(R.drawable.bg_pill_red);
        errTv.setPadding(dp(12), dp(8), dp(12), dp(8));
        LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        ep.bottomMargin = dp(14);
        errTv.setLayoutParams(ep);
        layout.addView(errTv);

        Button verifyBtn = new Button(this);
        verifyBtn.setText("🚀 VERIFY OTP & COMPLETE DELIVERY");
        verifyBtn.setTextSize(13);
        verifyBtn.setTypeface(null, Typeface.BOLD);
        verifyBtn.setTextColor(Color.WHITE);
        verifyBtn.setBackgroundResource(R.drawable.bg_button_green);
        verifyBtn.setPadding(0, dp(14), 0, dp(14));
        layout.addView(verifyBtn);

        Button cancelBtn = new Button(this);
        cancelBtn.setText("CANCEL");
        cancelBtn.setTextSize(12);
        cancelBtn.setTextColor(theme.colorTextSecondary);
        cancelBtn.setBackgroundResource(theme.resOutlineBtn);
        cancelBtn.setPadding(0, dp(10), 0, dp(10));
        LinearLayout.LayoutParams canp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        canp.topMargin = dp(8);
        cancelBtn.setLayoutParams(canp);
        layout.addView(cancelBtn);

        AlertDialog dialog = createDialogBuilder()
                .setView(sv)
                .setCancelable(false)
                .create();

        cancelBtn.setOnClickListener(v -> dialog.dismiss());

        final CheckBox finalCashCb = cashConfirmCb;
        verifyBtn.setOnClickListener(v -> {
            String otp = otpIn.getText().toString().trim();
            if (otp.isEmpty() || otp.length() < 4) {
                errTv.setText("⚠️ Kripya customer ka 4-digit OTP dalein!");
                errTv.setVisibility(View.VISIBLE);
                return;
            }
            if (finalCashCb != null && !finalCashCb.isChecked()) {
                errTv.setText("⚠️ Kripya confirm karein ki aapne ₹" + ((int) total) + " Cash le liya hai!");
                errTv.setVisibility(View.VISIBLE);
                return;
            }

            errTv.setVisibility(View.GONE);
            verifyBtn.setEnabled(false);
            verifyBtn.setText("VERIFYING OTP...");

            new Thread(() -> {
                try {
                    JSONObject payload = new JSONObject();
                    payload.put("orderId", orderId);
                    payload.put("otp", otp);
                    payload.put("token", getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getString("delivery_boy_token", ""));
                    payload.put("boyName", getSharedPreferences("dukandar_prefs", MODE_PRIVATE).getString("delivery_boy_name", "Delivery Partner"));

                    JSONObject res = sendJsonHttpRequestWithCandidateFallback("/api/delivery/verify-otp", "POST", payload);

                    runOnUiThread(() -> {
                        dialog.dismiss();
                        Toast.makeText(this, "🎉 Order #" + orderId + " Successfully Delivered!", Toast.LENGTH_LONG).show();
                        AudioAlertManager.playOrderChime(MainActivity.this);
                        SmsGatewayService.triggerRefresh();
                        SharedPreferences p = getSharedPreferences("dukandar_prefs", MODE_PRIVATE);
                        if (p.getBoolean("is_delivery_logged_in", false)) {
                            renderDeliveryConsole();
                        } else {
                            renderOrdersTab();
                        }
                    });
                } catch (Exception e) {
                    runOnUiThread(() -> {
                        verifyBtn.setEnabled(true);
                        verifyBtn.setText("🚀 VERIFY OTP & COMPLETE DELIVERY");
                        errTv.setText("❌ " + e.getMessage());
                        errTv.setVisibility(View.VISIBLE);
                    });
                }
            }).start();
        });

        dialog.show();
    }

    private JSONObject sendJsonHttpRequestWithCandidateFallback(String endpointPath, String method, JSONObject jsonBody) throws Exception {
        activeApiBase = "https://churuone-backend.onrender.com";
        return sendJsonHttpRequest(activeApiBase + endpointPath, method, jsonBody);
    }

    private JSONObject sendJsonHttpRequest(String urlStr, String method, JSONObject jsonBody) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(15000);
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("User-Agent", "ShawarmaDukandar/5.0 (Android)");
        conn.setRequestProperty("X-Store-Id", SmsGatewayService.getConfiguredStoreId(this));
        conn.setRequestProperty("X-Admin-Token", "dukandar_master_token_2026");
        conn.setRequestProperty("Authorization", "Bearer dukandar_master_token_2026");
        if (jsonBody != null) {
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            OutputStream os = conn.getOutputStream();
            os.write(jsonBody.toString().getBytes(StandardCharsets.UTF_8));
            os.flush();
            os.close();
        }
        int code = conn.getResponseCode();
        InputStream is = (code >= 200 && code < 400) ? conn.getInputStream() : conn.getErrorStream();
        if (is == null) {
            throw new Exception("Server returned HTTP " + code);
        }
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        reader.close();

        String raw = sb.toString().trim();
        // Guard against HTML error pages (e.g. <!DOCTYPE html>) causing JSONException
        if (!raw.startsWith("{") && !raw.startsWith("[")) {
            if (raw.toLowerCase().contains("cannot post") || raw.toLowerCase().contains("cannot get") || code == 404) {
                throw new Exception("API endpoint nahi mila (404). Server port 5001 check karein.");
            }
            if (code >= 400) {
                throw new Exception("Server error (HTTP " + code + "). Server se sampark nahi hua.");
            }
            throw new Exception("Server response valid JSON nahi hai (" + url.getHost() + "). IP check karein.");
        }

        JSONObject res = new JSONObject(raw);
        if (code >= 400) {
            String msg = res.optString("message", "Error " + code);
            throw new Exception(msg);
        }
        return res;
    }
}
