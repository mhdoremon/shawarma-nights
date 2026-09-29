import re
import os

MAIN_ACTIVITY = r"c:\Users\HCI\OneDrive\Desktop\first projerct\shawarma_nights\android-gateway\src\com\shawarma\smsgateway\MainActivity.java"

with open(MAIN_ACTIVITY, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Tooltip helper method
tooltip_helper = """
    private void showTooltip(String title, String message) {
        createDialogBuilder()
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show();
    }
"""
if "showTooltip" not in content:
    content = content.replace("private EditText createLabeledInput", tooltip_helper + "\n    private EditText createLabeledInput")

# 2. Overwrite showEditDealDialog with chip implementation
# We will just write a new showEditDealDialog
new_deal_dialog = """
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
        EditText typeIn = createLabeledInput(form, "Discount Type (percentage/flat/freeDelivery/bogo/freeItem)", initialType);
        
        EditText valIn = createLabeledInput(form, "Discount Value", isEdit ? String.valueOf(deal.optDouble("discountValue", deal.optDouble("discountPercent", 0))) : "");
        
        LinearLayout maxCapLayout = new LinearLayout(this);
        maxCapLayout.setOrientation(LinearLayout.HORIZONTAL);
        TextView maxCapLbl = new TextView(this);
        maxCapLbl.setText("Max Cap (Up to ₹) ");
        maxCapLbl.setTextSize(11);
        maxCapLbl.setTypeface(null, Typeface.BOLD);
        maxCapLbl.setTextColor(theme.colorTextSecondary);
        maxCapLayout.addView(maxCapLbl);
        
        TextView maxCapInfo = new TextView(this);
        maxCapInfo.setText("ℹ️");
        maxCapInfo.setPadding(dp(4),0,dp(4),0);
        maxCapInfo.setOnClickListener(v -> showTooltip("Max Cap", "Percentage discount se zyada se zyada kitne rupaye ki chhoot mil sakti hai. Jaise 50% discount par max ₹150 cap lagane se ₹500 ke order par ₹150 hi discount hoga, ₹250 nahi."));
        maxCapLayout.addView(maxCapInfo);
        
        form.addView(maxCapLayout);
        EditText maxIn = new EditText(this);
        maxIn.setText(isEdit ? String.valueOf(deal.optDouble("maxDiscount", 0)) : "");
        maxIn.setTextColor(theme.colorInputText);
        maxIn.setBackgroundResource(theme.resInputBg);
        maxIn.setPadding(dp(12), dp(10), dp(12), dp(10));
        form.addView(maxIn);

        EditText minIn = createLabeledInput(form, "Min Order", isEdit ? String.valueOf(deal.optDouble("minOrder", 0)) : "");
        EditText usageLimitIn = createLabeledInput(form, "Usage Limit (0 for unlimited)", isEdit ? String.valueOf(deal.optInt("usageLimit", 0)) : "0");
        EditText perUserLimitIn = createLabeledInput(form, "Per User Limit (0 for unlimited)", isEdit ? String.valueOf(deal.optInt("perUserLimit", 1)) : "1");
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
"""

start_idx = content.find("private void showEditDealDialog(JSONObject deal) {")
end_idx = content.find("private void renderCustomersTab() {")

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_deal_dialog + "\n    " + content[end_idx:]

# 3. Add Free Delivery Threshold setting in renderSettingsTab
free_delivery_card = """
        // FREE DELIVERY THRESHOLD CARD
        LinearLayout fdCard = new LinearLayout(this);
        fdCard.setOrientation(LinearLayout.VERTICAL);
        fdCard.setBackgroundResource(theme.resCardBg);
        fdCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        LinearLayout.LayoutParams fdcp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        fdcp.bottomMargin = dp(14);
        fdCard.setLayoutParams(fdcp);

        TextView fdTitle = new TextView(this);
        fdTitle.setText("🚚 FREE DELIVERY THRESHOLD");
        fdTitle.setTextSize(12);
        fdTitle.setTypeface(null, Typeface.BOLD);
        fdTitle.setTextColor(theme.colorTextMuted);
        fdCard.addView(fdTitle);
        
        JSONObject currentStoreInfo = SmsGatewayService.storeInfoObj;
        double currentThreshold = currentStoreInfo != null ? currentStoreInfo.optDouble("freeDeliveryThreshold", 350.0) : 350.0;

        TextView fdSub = new TextView(this);
        fdSub.setText("Current Threshold: ₹" + (int)currentThreshold);
        fdSub.setTextSize(13);
        fdSub.setTextColor(theme.colorTextSecondary);
        fdSub.setPadding(0, dp(4), 0, dp(10));
        fdCard.addView(fdSub);
        
        EditText fdCustom = new EditText(this);
        fdCustom.setText(String.valueOf((int)currentThreshold));
        fdCustom.setHint("Custom Amount");
        fdCustom.setInputType(InputType.TYPE_CLASS_NUMBER);
        fdCustom.setTextColor(theme.colorInputText);
        fdCustom.setBackgroundResource(theme.resInputBg);
        fdCustom.setPadding(dp(12), dp(10), dp(12), dp(10));
        
        HorizontalScrollView fdScroll = new HorizontalScrollView(this);
        fdScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout fdChips = new LinearLayout(this);
        fdChips.setOrientation(LinearLayout.HORIZONTAL);
        fdChips.setPadding(0, 0, 0, dp(10));
        
        int[] threshVals = {199, 299, 349, 499};
        for(int tv : threshVals) {
            TextView chip = new TextView(this);
            chip.setText("₹" + tv);
            chip.setTextSize(12);
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
        saveFdBtn.setText("SAVE THRESHOLD");
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
                Toast.makeText(this, "Free Delivery Threshold Saved!", Toast.LENGTH_SHORT).show();
                fdSub.setText("Current Threshold: ₹" + (int)nVal);
            } catch (Exception ignored) {}
        });
        fdCard.addView(saveFdBtn);
        container.addView(fdCard);
"""
# inject before JSONObject storeInfo = SmsGatewayService.storeInfoObj; in renderSettingsTab
content = content.replace("JSONObject storeInfo = SmsGatewayService.storeInfoObj;", free_delivery_card + "\n        JSONObject storeInfo = SmsGatewayService.storeInfoObj;")

with open(MAIN_ACTIVITY, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched successfully")
