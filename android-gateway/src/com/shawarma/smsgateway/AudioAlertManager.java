package com.shawarma.smsgateway;

import android.content.Context;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

/**
 * AudioAlertManager:
 * Plays a loud kitchen chime / ringtone whenever a new order is received
 * from the Shawarma Nights cloud server.
 */
public class AudioAlertManager {
    private static final String TAG = "AudioAlertManager";

    /**
     * Plays a high-priority loud kitchen chime for new orders.
     */
    public static void playOrderChime(Context context) {
        new Thread(() -> {
            try {
                // 1. Play dual melodic kitchen bell chime via ToneGenerator
                ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
                toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 350);
                Thread.sleep(400);
                toneGen.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 450);
                Thread.sleep(500);
                toneGen.release();
            } catch (Throwable t) {
                Log.w(TAG, "ToneGenerator failed: " + t.getMessage());
            }

            // 2. Also play system notification / alarm chime for maximum audibility
            try {
                if (context != null) {
                    Uri alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                    if (alertUri == null) {
                        alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                    }
                    if (alertUri != null) {
                        Ringtone ringtone = RingtoneManager.getRingtone(context.getApplicationContext(), alertUri);
                        if (ringtone != null) {
                            ringtone.play();
                        }
                    }
                }
            } catch (Throwable t) {
                Log.w(TAG, "RingtoneManager failed: " + t.getMessage());
            }
        }).start();
    }

    /**
     * Test chime button trigger from Settings tab.
     */
    public static void testChime(Context context) {
        playOrderChime(context);
    }
}
