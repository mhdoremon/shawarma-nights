const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, 'src/com/shawarma/smsgateway/MainActivity.java');

const javaCode = `package com.shawarma.smsgateway;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
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

import org.json.JSONArray;
import org.json.JSONObject;

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

    // 8 Tab Containers
    private ScrollView[] tabScrollViews = new ScrollView[8];
    private LinearLayout[] tabContainers = new LinearLayout[8];

    // Navigation Tab Chips
    private TextView[] navChipButtons = new TextView[8];

    private int dp(int val) {
        return (int) (val * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        updateCurrentTheme();
        buildNativeUI();
        setContentView(rootLayout);
        applyWindowTheme(theme.isDark);

        // Start Gateway background service
        startGatewayService();

        // Check required runtime permissions
        checkAndRequestPermissions();
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

        if (!needed.isEmpty()) {
            requestPermissions(needed.toArray(new String[0]), PERMISSION_REQ_CODE);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        SmsGatewayService.registerListener(this);
        updateStatusHeader(SmsGatewayService.isConnected(), SmsGatewayService.activeServerHost);
        refreshActiveTab();
    }

    @Override
    protected void onPause() {
        super.onPause();
        SmsGatewayService.unregisterListener(this);
    }

    @Override
    public void onDataChanged() {
        runOnUiThread(this::refreshActiveTab);
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
            statusIndicator.setText("● Connecting...");
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
            actionBtn.setText("MARK DELIVERED & COLLECT CASH");
            actionBtn.setBackgroundResource(R.drawable.bg_button_green);
            actionBtn.setOnClickListener(v -> {
                SmsGatewayService.sendUpdateOrderStatus(orderId, "delivered");
                Toast.makeText(this, "Order #" + orderId + " completed!", Toast.LENGTH_SHORT).show();
            });
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
        builder.setTitle(isEdit ? "Edit Dish" : "Add New Dish to Menu");

        ScrollView sv = new ScrollView(this);
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(20), dp(10), dp(20), dp(10));

        // Name
        EditText nameInput = new EditText(this);
        nameInput.setHint("Dish Name (e.g. Charcoal Chicken Roll)");
        if (isEdit) nameInput.setText(existing.optString("name", ""));
        nameInput.setTextColor(theme.colorInputText);
        nameInput.setHintTextColor(theme.colorInputHint);
        form.addView(nameInput);

        // Category
        EditText catInput = new EditText(this);
        catInput.setHint("Category (e.g. shawarmas, platters, fries)");
        if (isEdit) catInput.setText(existing.optString("category", "shawarmas"));
        catInput.setTextColor(theme.colorInputText);
        catInput.setHintTextColor(theme.colorInputHint);
        form.addView(catInput);

        // Price
        EditText priceInput = new EditText(this);
        priceInput.setHint("Selling Price ₹ (e.g. 180)");
        priceInput.setInputType(InputType.TYPE_CLASS_NUMBER);
        if (isEdit) priceInput.setText(String.valueOf((int) existing.optDouble("price", 0)));
        priceInput.setTextColor(theme.colorInputText);
        priceInput.setHintTextColor(theme.colorInputHint);
        form.addView(priceInput);

        // Original Price
        EditText origPriceInput = new EditText(this);
        origPriceInput.setHint("Original / Strike Price ₹ (optional)");
        origPriceInput.setInputType(InputType.TYPE_CLASS_NUMBER);
        if (isEdit && existing.has("originalPrice")) {
            origPriceInput.setText(String.valueOf((int) existing.optDouble("originalPrice", 0)));
        }
        origPriceInput.setTextColor(theme.colorInputText);
        origPriceInput.setHintTextColor(theme.colorInputHint);
        form.addView(origPriceInput);

        // Veg Checkbox
        CheckBox vegCb = new CheckBox(this);
        vegCb.setText("Is Pure Vegetarian?");
        if (isEdit) vegCb.setChecked(existing.optBoolean("isVeg", false));
        vegCb.setTextColor(theme.colorTextPrimary);
        form.addView(vegCb);

        // Badge
        EditText badgeInput = new EditText(this);
        badgeInput.setHint("Badge tag (e.g. Bestseller, Special)");
        if (isEdit) badgeInput.setText(existing.optString("badge", ""));
        badgeInput.setTextColor(theme.colorInputText);
        badgeInput.setHintTextColor(theme.colorInputHint);
        form.addView(badgeInput);

        // Prep Time
        EditText prepInput = new EditText(this);
        prepInput.setHint("Prep Time (e.g. 15-20 min)");
        if (isEdit) prepInput.setText(existing.optString("prepTime", "15-20 min"));
        prepInput.setTextColor(theme.colorInputText);
        prepInput.setHintTextColor(theme.colorInputHint);
        form.addView(prepInput);

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

            try {
                if (isEdit) {
                    JSONObject updates = new JSONObject();
                    updates.put("name", name);
                    updates.put("category", cat.isEmpty() ? "shawarmas" : cat);
                    updates.put("price", price);
                    updates.put("originalPrice", origPrice);
                    updates.put("isVeg", vegCb.isChecked());
                    updates.put("badge", badgeInput.getText().toString().trim());
                    updates.put("prepTime", prepInput.getText().toString().trim());
                    SmsGatewayService.sendUpdateMenuItem(existing.optString("id"), updates);
                    Toast.makeText(this, "Dish updated successfully!", Toast.LENGTH_SHORT).show();
                } else {
                    JSONObject newItem = new JSONObject();
                    newItem.put("id", "dish-" + System.currentTimeMillis());
                    newItem.put("name", name);
                    newItem.put("category", cat.isEmpty() ? "shawarmas" : cat);
                    newItem.put("price", price);
                    newItem.put("originalPrice", origPrice);
                    newItem.put("isVeg", vegCb.isChecked());
                    newItem.put("badge", badgeInput.getText().toString().trim());
                    newItem.put("prepTime", prepInput.getText().toString().trim());
                    newItem.put("available", true);
                    SmsGatewayService.sendAddMenuItem(newItem);
                    Toast.makeText(this, "Dish added to Menu!", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception ignored) {}
        });

        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    private void confirmDeleteDish(String id, String name) {
        createDialogBuilder()
                .setTitle("Delete Dish")
                .setMessage("Kya aap \\"" + name + "\\" ko menu se permanently delete karna chahte hain?")
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
                int pct = deal.optInt("discountPercent", 0);
                int minOrder = deal.optInt("minOrder", 0);

                LinearLayout dCard = new LinearLayout(this);
                dCard.setOrientation(LinearLayout.HORIZONTAL);
                dCard.setBackgroundResource(theme.resCardBg);
                dCard.setGravity(Gravity.CENTER_VERTICAL);
                dCard.setPadding(dp(14), dp(14), dp(14), dp(14));
                LinearLayout.LayoutParams dp1 = new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                dp1.bottomMargin = dp(10);
                dCard.setLayoutParams(dp1);

                LinearLayout dInfo = new LinearLayout(this);
                dInfo.setOrientation(LinearLayout.VERTICAL);
                dInfo.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

                TextView codeTv = new TextView(this);
                codeTv.setText(code);
                codeTv.setTextSize(16);
                codeTv.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
                codeTv.setTextColor(Color.parseColor("#DC2626"));
                dInfo.addView(codeTv);

                TextView descTv = new TextView(this);
                descTv.setText(dName + " • " + pct + "% OFF on orders above ₹" + minOrder);
                descTv.setTextSize(12);
                descTv.setTextColor(theme.colorTextSecondary);
                dInfo.addView(descTv);
                dCard.addView(dInfo);

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

        JSONObject h = SmsGatewayService.heroBannerObj;

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
        AlertDialog.Builder builder = createDialogBuilder();
        builder.setTitle("Add New Promo Code");

        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(20), dp(10), dp(20), dp(10));

        EditText codeIn = new EditText(this);
        codeIn.setHint("Coupon Code (e.g. NIGHT50)");
        codeIn.setTextColor(theme.colorInputText);
        codeIn.setHintTextColor(theme.colorInputHint);
        form.addView(codeIn);

        EditText titleIn = new EditText(this);
        titleIn.setHint("Title (e.g. 50% OFF Midnight Craving)");
        titleIn.setTextColor(theme.colorInputText);
        titleIn.setHintTextColor(theme.colorInputHint);
        form.addView(titleIn);

        EditText pctIn = new EditText(this);
        pctIn.setHint("Discount % (e.g. 50)");
        pctIn.setInputType(InputType.TYPE_CLASS_NUMBER);
        pctIn.setTextColor(theme.colorInputText);
        pctIn.setHintTextColor(theme.colorInputHint);
        form.addView(pctIn);

        EditText minIn = new EditText(this);
        minIn.setHint("Min Order ₹ (e.g. 199)");
        minIn.setInputType(InputType.TYPE_CLASS_NUMBER);
        minIn.setTextColor(theme.colorInputText);
        minIn.setHintTextColor(theme.colorInputHint);
        form.addView(minIn);

        builder.setView(form);
        builder.setPositiveButton("Create Deal", (d, w) -> {
            String code = codeIn.getText().toString().trim().toUpperCase(Locale.ROOT);
            String title = titleIn.getText().toString().trim();
            int pct = 0;
            try { pct = Integer.parseInt(pctIn.getText().toString().trim()); } catch (Exception ignored) {}
            int min = 0;
            try { min = Integer.parseInt(minIn.getText().toString().trim()); } catch (Exception ignored) {}

            if (code.isEmpty() || pct <= 0) {
                Toast.makeText(this, "Please enter valid code and discount", Toast.LENGTH_SHORT).show();
                return;
            }

            try {
                JSONObject deal = new JSONObject();
                deal.put("code", code);
                deal.put("title", title.isEmpty() ? (pct + "% OFF") : title);
                deal.put("discountPercent", pct);
                deal.put("minOrder", min);
                deal.put("bg", "bg-[#DC2626]");
                deal.put("text", "text-white");
                SmsGatewayService.sendAddDeal(deal);
                Toast.makeText(this, "Deal " + code + " Created!", Toast.LENGTH_SHORT).show();
            } catch (Exception ignored) {}
        });
        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    // ==========================================
    // TAB 4: CUSTOMERS DATABASE (VIP VAULT)
    // ==========================================

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
                cTv.setText("\\"" + comment + "\\"");
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
        themeCard.addView(changeThemeBtn);

        container.addView(themeCard);

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
}
`;

fs.writeFileSync(targetFile, javaCode, 'utf8');
console.log('Successfully written updated MainActivity.java!');
