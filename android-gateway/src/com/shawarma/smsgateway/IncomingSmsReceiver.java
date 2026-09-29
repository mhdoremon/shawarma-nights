package com.shawarma.smsgateway;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

public class IncomingSmsReceiver extends BroadcastReceiver {
    private static final String TAG = "ShawarmaSMS";
    private static final String SMS_RECEIVED_ACTION = "android.provider.Telephony.SMS_RECEIVED";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !SMS_RECEIVED_ACTION.equals(intent.getAction())) {
            return;
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null) {
            return;
        }

        try {
            Object[] pdus = (Object[]) bundle.get("pdus");
            if (pdus == null || pdus.length == 0) {
                return;
            }

            String format = bundle.getString("format");

            for (Object pdu : pdus) {
                SmsMessage sms;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && format != null) {
                    sms = SmsMessage.createFromPdu((byte[]) pdu, format);
                } else {
                    sms = SmsMessage.createFromPdu((byte[]) pdu);
                }

                if (sms != null) {
                    String sender = sms.getDisplayOriginatingAddress();
                    String messageBody = sms.getMessageBody();
                    Log.i(TAG, "Incoming SMS detected from: " + sender);
                    SmsGatewayService.onIncomingSms(context, sender, messageBody);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing incoming SMS: " + e.getMessage(), e);
        }
    }
}
