package com.churuone.otprelay;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Locale;

public class MainActivity extends Activity implements OtpRelayService.RelayStatusListener {

    private static final int PERM_SMS_REQ = 101;

    private TextView statusPillTv;
    private TextView activeStoreTv;
    private TextView sentCountTv;
    private LinearLayout logsContainer;
    private Button toggleRelayBtn;
    private CheckBox consentCheckBox;
    private EditText storeIdInput;
    private EditText testPhoneInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        buildUi();
        checkAndRequestPermissions();
    }

    @Override
    protected void onResume() {
        super.onResume();
        OtpRelayService.setStatusListener(this);
        updateUiState();
    }

    @Override
    protected void onPause() {
        OtpRelayService.setStatusListener(null);
        super.onPause();
    }

    private int dp(int v) {
        return (int) (v * getResources().getDisplayMetrics().density);
    }

    private void buildUi() {
        ScrollView scrollView = new ScrollView(this);
        scrollView.setBackgroundColor(Color.parseColor("#FFFBF7"));
        scrollView.setFillViewport(true);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(16), dp(20), dp(16), dp(32));
        scrollView.addView(root);

        // 1. TOP BRAND HEADER
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.VERTICAL);
        header.setPadding(0, 0, 0, dp(16));

        TextView brandBadge = new TextView(this);
        brandBadge.setText("CHURUONE SMS INFRASTRUCTURE");
        brandBadge.setTextSize(10);
        brandBadge.setTypeface(null, Typeface.BOLD);
        brandBadge.setTextColor(Color.parseColor("#DC2626"));
        header.addView(brandBadge);

        TextView title = new TextView(this);
        title.setText("⚡ ChuruOne OTP Relay");
        title.setTextSize(22);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(Color.parseColor("#18181B"));
        header.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Dedicated Lightweight SIM Gateway — Sirf Dukan ke Customer OTP aur Alerts bhejne ke liye.");
        sub.setTextSize(12);
        sub.setTextColor(Color.parseColor("#71717A"));
        sub.setPadding(0, dp(2), 0, 0);
        header.addView(sub);

        root.addView(header);

        // 2. LIVE STATUS CARD
        LinearLayout statusCard = createCard();
        
        LinearLayout statusHeader = new LinearLayout(this);
        statusHeader.setOrientation(LinearLayout.HORIZONTAL);
        statusHeader.setGravity(Gravity.CENTER_VERTICAL);

        TextView statusTitle = new TextView(this);
        statusTitle.setText("GATEWAY STATUS");
        statusTitle.setTextSize(11);
        statusTitle.setTypeface(null, Typeface.BOLD);
        statusTitle.setTextColor(Color.parseColor("#71717A"));
        statusTitle.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        statusHeader.addView(statusTitle);

        statusPillTv = new TextView(this);
        statusPillTv.setText("OFFLINE");
        statusPillTv.setTextSize(10);
        statusPillTv.setTypeface(null, Typeface.BOLD);
        statusPillTv.setTextColor(Color.parseColor("#EF4444"));
        statusPillTv.setBackgroundResource(R.drawable.bg_pill_red);
        statusPillTv.setPadding(dp(10), dp(4), dp(10), dp(4));
        statusHeader.addView(statusPillTv);

        statusCard.addView(statusHeader);

        activeStoreTv = new TextView(this);
        activeStoreTv.setText("Connected Dukan: [shawarma]");
        activeStoreTv.setTextSize(14);
        activeStoreTv.setTypeface(null, Typeface.BOLD);
        activeStoreTv.setTextColor(Color.parseColor("#18181B"));
        activeStoreTv.setPadding(0, dp(8), 0, dp(4));
        statusCard.addView(activeStoreTv);

        sentCountTv = new TextView(this);
        sentCountTv.setText("Total OTPs Sent: 0");
        sentCountTv.setTextSize(12);
        sentCountTv.setTextColor(Color.parseColor("#10B981"));
        sentCountTv.setTypeface(null, Typeface.BOLD);
        statusCard.addView(sentCountTv);

        root.addView(statusCard);

        // 3. SETUP & CONSENT CARD
        LinearLayout setupCard = createCard();

        TextView cfgTitle = new TextView(this);
        cfgTitle.setText("DUKAN CONFIGURATION & CONSENT");
        cfgTitle.setTextSize(12);
        cfgTitle.setTypeface(null, Typeface.BOLD);
        cfgTitle.setTextColor(Color.parseColor("#DC2626"));
        setupCard.addView(cfgTitle);

        TextView cfgSub = new TextView(this);
        cfgSub.setText("Apni dukan ki Store ID dalein jiske OTP is phone ki SIM se bhejne hain:");
        cfgSub.setTextSize(12);
        cfgSub.setTextColor(Color.parseColor("#71717A"));
        cfgSub.setPadding(0, dp(2), 0, dp(8));
        setupCard.addView(cfgSub);

        // Store ID Input
        storeIdInput = new EditText(this);
        String savedStore = OtpRelayService.getConfiguredStoreId(this);
        storeIdInput.setText(savedStore);
        storeIdInput.setHint("e.g. shawarma, pizza, burger");
        storeIdInput.setTextColor(Color.parseColor("#18181B"));
        storeIdInput.setBackgroundResource(R.drawable.bg_edit_text_light);
        storeIdInput.setPadding(dp(12), dp(10), dp(12), dp(10));
        storeIdInput.setTextSize(14);
        setupCard.addView(storeIdInput);

        // Store Suggestion Chips
        HorizontalScrollView chipScroll = new HorizontalScrollView(this);
        chipScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout chipGroup = new LinearLayout(this);
        chipGroup.setOrientation(LinearLayout.HORIZONTAL);
        chipGroup.setPadding(0, dp(6), 0, dp(12));

        String[] presets = new String[]{"shawarma", "pizza", "burger", "fashion"};
        for (String p : presets) {
            TextView chip = new TextView(this);
            chip.setText(p);
            chip.setTextSize(11);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setTextColor(Color.parseColor("#52525B"));
            chip.setBackgroundResource(R.drawable.bg_button_outline_light);
            chip.setPadding(dp(10), dp(5), dp(10), dp(5));
            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cp.rightMargin = dp(6);
            chip.setLayoutParams(cp);
            chip.setOnClickListener(v -> storeIdInput.setText(p));
            chipGroup.addView(chip);
        }
        chipScroll.addView(chipGroup);
        setupCard.addView(chipScroll);

        // CONSENT CHECKBOX (महत्वपूर्ण सहमति टिक बॉक्स)
        LinearLayout consentBox = new LinearLayout(this);
        consentBox.setOrientation(LinearLayout.VERTICAL);
        consentBox.setBackgroundResource(R.drawable.bg_pill_gray_light);
        consentBox.setPadding(dp(12), dp(10), dp(12), dp(10));

        consentCheckBox = new CheckBox(this);
        SharedPreferences prefs = getSharedPreferences("otp_relay_prefs", MODE_PRIVATE);
        boolean hasConsented = prefs.getBoolean("has_consented", false);
        consentCheckBox.setChecked(hasConsented);
        consentCheckBox.setText("Main sahmat hoon ki yeh app meri dukan ke customer OTP aur order alerts SMS bhejne ke liye is phone ke SIM card ka upyog kare.");
        consentCheckBox.setTextSize(11);
        consentCheckBox.setTextColor(Color.parseColor("#27272A"));
        consentCheckBox.setTypeface(null, Typeface.BOLD);
        consentBox.addView(consentCheckBox);

        setupCard.addView(consentBox);

        // START / STOP TOGGLE BUTTON
        toggleRelayBtn = new Button(this);
        toggleRelayBtn.setText("🚀 START OTP RELAY (शुरू करें)");
        toggleRelayBtn.setTextSize(13);
        toggleRelayBtn.setTypeface(null, Typeface.BOLD);
        toggleRelayBtn.setTextColor(Color.WHITE);
        toggleRelayBtn.setBackgroundResource(R.drawable.bg_button_red);
        toggleRelayBtn.setPadding(0, dp(14), 0, dp(14));
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        bp.topMargin = dp(14);
        toggleRelayBtn.setLayoutParams(bp);

        toggleRelayBtn.setOnClickListener(v -> onToggleClicked());
        setupCard.addView(toggleRelayBtn);

        root.addView(setupCard);

        // 4. TEST SMS CARD
        LinearLayout testCard = createCard();

        TextView testTitle = new TextView(this);
        testTitle.setText("📱 TEST SIM SMS GATEWAY");
        testTitle.setTextSize(12);
        testTitle.setTypeface(null, Typeface.BOLD);
        testTitle.setTextColor(Color.parseColor("#18181B"));
        testCard.addView(testTitle);

        TextView testSub = new TextView(this);
        testSub.setText("Check karein ki is phone ki SIM se customer ko SMS ja raha hai ya nahi:");
        testSub.setTextSize(11);
        testSub.setTextColor(Color.parseColor("#71717A"));
        testSub.setPadding(0, dp(2), 0, dp(8));
        testCard.addView(testSub);

        testPhoneInput = new EditText(this);
        testPhoneInput.setHint("Mobile Number (e.g. 7023963189)");
        testPhoneInput.setInputType(InputType.TYPE_CLASS_PHONE);
        testPhoneInput.setTextColor(Color.parseColor("#18181B"));
        testPhoneInput.setBackgroundResource(R.drawable.bg_edit_text_light);
        testPhoneInput.setPadding(dp(12), dp(10), dp(12), dp(10));
        testPhoneInput.setTextSize(13);
        testCard.addView(testPhoneInput);

        Button testBtn = new Button(this);
        testBtn.setText("SEND TEST OTP SMS (चेक करें)");
        testBtn.setTextSize(12);
        testBtn.setTypeface(null, Typeface.BOLD);
        testBtn.setTextColor(Color.WHITE);
        testBtn.setBackgroundResource(R.drawable.bg_button_blue);
        testBtn.setPadding(0, dp(12), 0, dp(12));
        LinearLayout.LayoutParams tbp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tbp.topMargin = dp(10);
        testBtn.setLayoutParams(tbp);

        testBtn.setOnClickListener(v -> onSendTestClicked());
        testCard.addView(testBtn);

        root.addView(testCard);

        // 5. LIVE SENT SMS LOGS CARD
        LinearLayout logsCard = createCard();

        TextView logsTitle = new TextView(this);
        logsTitle.setText("📋 RECENT SENT OTP FEED (लाइव रिकॉर्ड)");
        logsTitle.setTextSize(12);
        logsTitle.setTypeface(null, Typeface.BOLD);
        logsTitle.setTextColor(Color.parseColor("#18181B"));
        logsCard.addView(logsTitle);

        logsContainer = new LinearLayout(this);
        logsContainer.setOrientation(LinearLayout.VERTICAL);
        logsContainer.setPadding(0, dp(8), 0, 0);
        logsCard.addView(logsContainer);

        root.addView(logsCard);

        setContentView(scrollView);
    }

    private LinearLayout createCard() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(R.drawable.bg_card_light);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = dp(12);
        card.setLayoutParams(lp);
        return card;
    }

    private void onToggleClicked() {
        SharedPreferences prefs = getSharedPreferences("otp_relay_prefs", MODE_PRIVATE);
        boolean isRunning = prefs.getBoolean("is_relay_running", false);

        if (!isRunning) {
            // Check consent
            if (!consentCheckBox.isChecked()) {
                Toast.makeText(this, "Kripya pehle sahmat (Consent) box par tick karein!", Toast.LENGTH_LONG).show();
                return;
            }

            // Save store id
            String sId = storeIdInput.getText().toString().trim().toLowerCase();
            if (sId.isEmpty()) sId = "shawarma";
            OtpRelayService.setConfiguredStoreId(this, sId);

            prefs.edit().putBoolean("has_consented", true).apply();

            // Start Service
            Intent serviceIntent = new Intent(this, OtpRelayService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }

            Toast.makeText(this, "ChuruOne OTP Relay shuru ho gaya! Store: " + sId, Toast.LENGTH_SHORT).show();
        } else {
            // Stop Service
            Intent serviceIntent = new Intent(this, OtpRelayService.class);
            stopService(serviceIntent);
            prefs.edit().putBoolean("is_relay_running", false).apply();
            Toast.makeText(this, "OTP Relay band kar diya gaya.", Toast.LENGTH_SHORT).show();
        }

        updateUiState();
    }

    private void onSendTestClicked() {
        String phone = testPhoneInput.getText().toString().trim();
        if (phone.isEmpty()) {
            Toast.makeText(this, "Mobile number dalein!", Toast.LENGTH_SHORT).show();
            return;
        }

        boolean ok = OtpRelayService.sendManualTestSms(this, phone);
        if (ok) {
            Toast.makeText(this, "Test SMS sent to " + phone + "!", Toast.LENGTH_SHORT).show();
            updateUiState();
        } else {
            Toast.makeText(this, "SMS failed! Check SIM recharge and SMS permissions.", Toast.LENGTH_LONG).show();
        }
    }

    private void updateUiState() {
        SharedPreferences prefs = getSharedPreferences("otp_relay_prefs", MODE_PRIVATE);
        boolean isRunning = prefs.getBoolean("is_relay_running", false);
        boolean isConnected = OtpRelayService.isConnected();
        String currentStore = OtpRelayService.getConfiguredStoreId(this);
        int sentCount = OtpRelayService.getSentCount(this);

        activeStoreTv.setText("Connected Dukan: [" + currentStore + "]");
        sentCountTv.setText("Total OTPs Sent: " + sentCount);

        if (isRunning && isConnected) {
            statusPillTv.setText("🟢 LIVE ONLINE");
            statusPillTv.setTextColor(Color.parseColor("#10B981"));
            statusPillTv.setBackgroundResource(R.drawable.bg_pill_green);
            toggleRelayBtn.setText("⏹️ STOP OTP RELAY (रोकें)");
            toggleRelayBtn.setBackgroundResource(R.drawable.bg_button_blue);
        } else if (isRunning) {
            statusPillTv.setText("🟡 CONNECTING...");
            statusPillTv.setTextColor(Color.parseColor("#F59E0B"));
            statusPillTv.setBackgroundResource(R.drawable.bg_pill_amber);
            toggleRelayBtn.setText("⏹️ STOP OTP RELAY (रोकें)");
            toggleRelayBtn.setBackgroundResource(R.drawable.bg_button_blue);
        } else {
            statusPillTv.setText("🔴 OFFLINE");
            statusPillTv.setTextColor(Color.parseColor("#EF4444"));
            statusPillTv.setBackgroundResource(R.drawable.bg_pill_red);
            toggleRelayBtn.setText("🚀 START OTP RELAY (शुरू करें)");
            toggleRelayBtn.setBackgroundResource(R.drawable.bg_button_red);
        }

        renderLogs();
    }

    private void renderLogs() {
        if (logsContainer == null) return;
        logsContainer.removeAllViews();

        if (OtpRelayService.smsLogs.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("Abhi koi OTP nahi bheja gaya. Naya customer order aane par yahan dikhega.");
            empty.setTextSize(11);
            empty.setTextColor(Color.parseColor("#A1A1AA"));
            logsContainer.addView(empty);
            return;
        }

        for (int i = 0; i < Math.min(OtpRelayService.smsLogs.size(), 10); i++) {
            String log = OtpRelayService.smsLogs.get(i);
            TextView item = new TextView(this);
            item.setText("• " + log);
            item.setTextSize(12);
            item.setTextColor(Color.parseColor("#3F3F46"));
            item.setPadding(0, dp(3), 0, dp(3));
            logsContainer.addView(item);
        }
    }

    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{
                        Manifest.permission.SEND_SMS,
                        Manifest.permission.READ_PHONE_STATE
                }, PERM_SMS_REQ);
            }

            // Request Battery Optimization Exemption
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                try {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    public void onConnectionChanged(boolean connected, String storeId) {
        runOnUiThread(this::updateUiState);
    }

    @Override
    public void onSmsSent(String phone, String status, String time) {
        runOnUiThread(this::updateUiState);
    }
}
