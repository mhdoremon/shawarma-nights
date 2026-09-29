package com.shawarma.smsgateway;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.SmsManager;
import android.util.Log;

public class SmsBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "ShawarmaSMS";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("com.shawarma.SEND_SMS".equals(intent.getAction())) {
            String phone = intent.getStringExtra("phone");
            String message = intent.getStringExtra("message");
            Log.i(TAG, "Received request to send SMS to: " + phone);

            if (phone != null && message != null && !phone.isEmpty()) {
                try {
                    SmsManager smsManager;
                    if (android.os.Build.VERSION.SDK_INT >= 31) {
                        smsManager = context.getSystemService(SmsManager.class);
                    } else {
                        smsManager = SmsManager.getDefault();
                    }
                    smsManager.sendTextMessage(phone, null, message, null, null);
                    Log.i(TAG, "SMS successfully dispatched from SIM to: " + phone);
                    setResultCode(1);
                } catch (Exception e) {
                    Log.e(TAG, "Error sending SMS: " + e.getMessage(), e);
                    setResultCode(0);
                }
            }
        }
    }
}
