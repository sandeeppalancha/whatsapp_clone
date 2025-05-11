package com.fyzks.chatapp;

import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the notification channel for API 26+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    "chat_messages",
                    "Chat Messages",
                    NotificationManager.IMPORTANCE_HIGH);
            
            channel.setDescription("Notifications for new chat messages");
            channel.setVibrationPattern(new long[]{0, 500, 200, 500});
            channel.enableVibration(true);
            channel.enableLights(true);
            
            NotificationManager notificationManager = 
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.createNotificationChannel(channel);
        }
    }
}