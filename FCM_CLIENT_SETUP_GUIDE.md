# 🔔 Firebase Cloud Messaging (FCM) Client App Integration & Dashboard Setup Guide

This guide provides complete instructions for configuring **Firebase Cloud Messaging (FCM HTTP v1)** in the Prompter Admin Dashboard and integrating push notifications into your client mobile applications (**Flutter**, **Android / Kotlin**, **iOS / Swift**, and **React Native**).

---

## 📑 Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Part 1: Firebase Console Setup & Credentials Generation](#2-part-1-firebase-console-setup--credentials-generation)
3. [Part 2: Admin Dashboard Setup](#3-part-2-admin-dashboard-setup)
4. [Part 3: Client App Token Registration API](#4-part-3-client-app-token-registration-api)
   - [`POST /api/v1/notifications/token` — Register Device FCM Token](#41-post-apiv1notificationstoken--register-device-fcm-token)
   - [`GET /api/v1/notifications` — Fetch In-App Notification Feed](#42-get-apiv1notifications--fetch-in-app-notification-feed)
5. [Part 4: Client App Code Implementations](#5-part-4-client-app-code-implementations)
   - [Flutter / Dart](#51-flutter--dart)
   - [Android (Kotlin)](#52-android-kotlin)
   - [iOS (Swift)](#53-ios-swift)
   - [React Native](#54-react-native)
6. [Part 5: Deep Linking & Notification Payload Schema](#6-part-5-deep-linking--notification-payload-schema)
7. [Troubleshooting & Verification Checklist](#7-troubleshooting--verification-checklist)

---

## 1. Architectural Overview

```
               ┌──────────────────────────────────────────────┐
               │         Prompter Admin Dashboard             │
               │   (/settings -> Notifications Tab)           │
               └──────────────────────┬───────────────────────┘
                                      │
               1. Broadcast Message   │ 2. Test Connection
               (Topic: "all_users")   │ (Google OAuth2 v1)
                                      ▼
               ┌──────────────────────────────────────────────┐
               │     Prompter Serverless API (Next.js)        │
               │       - Generates Google OAuth2 JWT          │
               │       - Dispatches to FCM HTTP v1 API        │
               └──────────────────────┬───────────────────────┘
                                      │
                                      │ Google FCM v1 HTTPS
                                      ▼
               ┌──────────────────────────────────────────────┐
               │         Firebase Cloud Messaging             │
               └──────────┬────────────────────────┬──────────┘
                          │                        │
       Android Push (FCM) │                        │ Apple Push (APNs)
                          ▼                        ▼
               ┌─────────────────────┐  ┌─────────────────────┐
               │    Android Device   │  │      iOS Device     │
               │  (Topic: all_users) │  │  (Topic: all_users) │
               └─────────────────────┘  └─────────────────────┘
```

### Core Features:
- **Google FCM HTTP v1 Standard**: Uses modern Google OAuth2 service account authentication (replaces deprecated legacy FCM APIs).
- **Instant Topic Broadcasting**: Messages sent to the `all_users` topic are delivered to millions of devices in a single HTTP call.
- **Multicast & Target Topics**: Target all devices, VIP users, or custom topic segments.
- **Device Fleet Tracking**: Automatically records registered client devices and platform counts (Android, iOS, Flutter, Web).
- **Rich Media & Deep Links**: Supports banner preview images and one-click app navigation links (`prompter://trending`, `prompter://category/...`).

---

## 2. Part 1: Firebase Console Setup & Credentials Generation

### Step 1.1: Create or Select Your Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., `prompter-ai-mobile`) or select your existing project.

### Step 1.2: Add Client Apps
1. **For Android**:
   - Click **Add app** → **Android**.
   - Enter your Android Package Name (e.g., `com.prompter.app`).
   - Download `google-services.json` and place it in your Android app's `app/` directory.
2. **For iOS**:
   - Click **Add app** → **iOS**.
   - Enter your iOS Bundle ID (e.g., `com.prompter.app`).
   - Download `GoogleService-Info.plist` and add it to your Xcode project.
   - In **Project Settings** → **Cloud Messaging** → **Apple app configuration**, upload your **APNs Authentication Key (`.p8`)**.

### Step 1.3: Generate Google Service Account Key (For Admin Dashboard)
1. In the Firebase Console, click the **Gear Icon (⚙️)** next to Project Overview → **Project settings**.
2. Switch to the **Service accounts** tab.
3. Select **Firebase Admin SDK** (Node.js).
4. Click **Generate new private key** → confirm by clicking **Generate key**.
5. A JSON file (`<project-id>-firebase-adminsdk-....json`) will be downloaded to your computer.

This file contains:
- `project_id`
- `client_email`
- `private_key`

---

## 3. Part 2: Admin Dashboard Setup

1. Log in to your Prompter Admin Panel at `http://localhost:3000/settings` (or your production Vercel URL).
2. Click on the **Push Notifications** tab.
3. You will see the **Device Fleet Metrics Bar** (Active Devices, Android Fleet, iOS Fleet, Broadcasts Dispatched).
4. Select the **Firebase Cloud Messaging (FCM v1)** provider pill.
5. Click the **"Paste Service Account JSON"** button:
   - Open your downloaded `<project-id>-firebase-adminsdk-....json` file in a text editor.
   - Copy the entire JSON content and paste it into the modal textarea.
   - Click **Parse & Apply Credentials**.
   - The dashboard will automatically populate:
     - **Firebase Project ID**
     - **Firebase Client Email**
     - **Firebase Private Key**
6. Click **Test FCM Connection (Dry Run)**:
   - The backend validates the Google OAuth2 service account token and sends a dry-run test to Google's FCM v1 endpoint.
   - You will see a green badge: `Firebase Cloud Messaging credentials verified successfully!`.
7. Toggle **Enable Push Notifications Broadcasts** to **ON**.
8. Click **Save Gateway Settings**.

---

## 4. Part 3: Client App Token Registration API

### 4.1 `POST /api/v1/notifications/token` — Register Device FCM Token

When your client app launches or receives a new FCM registration token from the Firebase SDK, call this endpoint to register or update the device in the backend database.

#### Headers:
| Header | Required | Description |
|---|---|---|
| `x-api-key` | Yes | Client API key |
| `x-device-id` | Yes | Unique hardware device UUID |
| `Content-Type` | Yes | `application/json` |

#### Request Body (`application/json`):
```json
{
  "token": "eX1Z9...fcm_registration_token_from_firebase_sdk...",
  "deviceId": "3c9b1f28-8d4e-4e6f-b2a1-9c8e7f6a5b4c",
  "userId": "sarah.jenkins@gmail.com",
  "platform": "android",
  "appVersion": "1.2.0"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `token` | string | Yes | The FCM device registration token |
| `deviceId` | string | Optional | Hardware device UUID |
| `userId` | string | Optional | User email or ID if authenticated |
| `platform` | string | Optional | `"android"`, `"ios"`, `"flutter"`, or `"web"` |
| `appVersion` | string | Optional | App build version (e.g. `"1.2.0"`) |

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "FCM device token registered successfully",
  "data": {
    "id": "cmtl8x...9v",
    "platform": "android",
    "isActive": true,
    "registeredAt": "2026-11-02T11:00:00.000Z"
  }
}
```

---

### 4.2 `GET /api/v1/notifications` — Fetch In-App Notification Feed

Retrieves the list of sent broadcasts so the client app can display an in-app "Notifications Center" or "Alerts Inbox".

```http
GET /api/v1/notifications?limit=20
Headers:
  x-api-key: YOUR_CLIENT_API_KEY
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "cmtl3...45",
      "title": "🔥 50+ New Midjourney Prompts Live!",
      "message": "Explore our curated collection of photorealistic lighting and UI design prompts.",
      "image": "https://your-domain.com/uploads/midjourney-banner.png",
      "deepLink": "prompter://trending",
      "sentAt": "2026-11-02T10:30:00.000Z",
      "createdAt": "2026-11-02T10:30:00.000Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

## 5. Part 4: Client App Code Implementations

### 5.1 Flutter / Dart

#### Step 1: Install Dependencies
In your Flutter `pubspec.yaml`:
```yaml
dependencies:
  firebase_core: ^3.6.0
  firebase_messaging: ^15.1.3
  flutter_local_notifications: ^17.2.3
  http: ^1.2.2
```

#### Step 2: Implementation (`fcm_notification_service.dart`):
```dart
import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;

class FcmNotificationService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  static const String baseUrl = 'https://your-domain.com/api/v1';
  static const String apiKey = 'YOUR_CLIENT_API_KEY';

  /// Initialize FCM on app launch
  static Future<void> initialize({required String deviceId, String? userId}) async {
    // 1. Request notification permissions (required for iOS & Android 13+)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // 2. Subscribe to the default broadcast topic
      await _fcm.subscribeToTopic('all_users');
      print('Subscribed to FCM topic: all_users');

      // 3. Obtain FCM device token
      String? token = await _fcm.getToken();
      if (token != null) {
        await _registerTokenWithBackend(
          token: token,
          deviceId: deviceId,
          userId: userId,
        );
      }

      // 4. Listen for token refreshes
      _fcm.onTokenRefresh.listen((newToken) {
        _registerTokenWithBackend(
          token: newToken,
          deviceId: deviceId,
          userId: userId,
        );
      });

      // 5. Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('Foreground notification received: ${message.notification?.title}');
        // Display in-app banner or local notification
      });

      // 6. Handle notification click (when app opened from notification)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleDeepLink(message.data['deepLink']);
      });
    }
  }

  /// Register device token with Prompter backend
  static Future<void> _registerTokenWithBackend({
    required String token,
    required String deviceId,
    String? userId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/notifications/token'),
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'token': token,
          'deviceId': deviceId,
          'userId': userId,
          'platform': Platform.isIOS ? 'ios' : 'android',
          'appVersion': '1.0.0',
        }),
      );
      print('FCM Token registration response: ${response.statusCode}');
    } catch (e) {
      print('Error registering FCM token: $e');
    }
  }

  static void _handleDeepLink(String? deepLink) {
    if (deepLink == null || deepLink.isEmpty) return;
    print('Navigate to deepLink: $deepLink');
    // Example: Router.navigate(deepLink);
  }
}
```

---

### 5.2 Android (Kotlin)

#### Step 1: Add Firebase Messaging Dependency
In your `app/build.gradle`:
```groovy
dependencies {
    implementation platform('com.google.firebase:firebase-bom:33.5.1')
    implementation 'com.google.firebase:firebase-messaging-ktx'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
}
```

#### Step 2: Create `MyFirebaseMessagingService.kt`:
```kotlin
package com.prompter.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Automatically register new token with Prompter backend
        sendRegistrationToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "Prompter Alert"
        val message = remoteMessage.notification?.body ?: remoteMessage.data["message"] ?: ""
        val deepLink = remoteMessage.data["deepLink"]

        showNotification(title, message, deepLink)
    }

    private fun showNotification(title: String, message: String, deepLink: String?) {
        val channelId = "prompter_general_notifications"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Prompter Alerts",
                NotificationManager.IMPORTANCE_HIGH
            )
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink ?: "prompter://home")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun sendRegistrationToServer(token: String) {
        Thread {
            try {
                val client = OkHttpClient()
                val json = JSONObject().apply {
                    put("token", token)
                    put("platform", "android")
                }
                val body = json.toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("https://your-domain.com/api/v1/notifications/token")
                    .addHeader("x-api-key", "YOUR_CLIENT_API_KEY")
                    .post(body)
                    .build()
                client.newCall(request).execute()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }.start()
    }

    companion object {
        fun subscribeToBroadcastTopic() {
            FirebaseMessaging.getInstance().subscribeToTopic("all_users")
        }
    }
}
```

---

### 5.3 iOS (Swift)

#### Step 1: Subscribe to Topic in `AppDelegate.swift`:
```swift
import UIKit
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        Messaging.messaging().delegate = self

        // Request Push Notification Authorization
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            guard granted else { return }
            DispatchQueue.main.async {
                application.registerForRemoteNotifications()
            }
        }

        // Subscribe to default broadcast topic
        Messaging.messaging().subscribe(toTopic: "all_users") { error in
            if let error = error {
                print("Failed to subscribe to FCM topic: \(error)")
            } else {
                print("Subscribed to FCM topic: all_users")
            }
        }

        return true
    }

    // Delegate: Received new FCM Token
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        print("Received FCM token: \(token)")
        registerTokenWithBackend(token: token)
    }

    private func registerTokenWithBackend(token: String) {
        guard let url = URL(string: "https://your-domain.com/api/v1/notifications/token") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("YOUR_CLIENT_API_KEY", forHTTPHeaderField: "x-api-key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "token": token,
            "platform": "ios"
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        URLSession.shared.dataTask(with: request).resume()
    }
}
```

---

### 5.4 React Native

```typescript
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import { Platform } from 'react-native';

const API_BASE = 'https://your-domain.com/api/v1';
const API_KEY = 'YOUR_CLIENT_API_KEY';

export async function setupFCM(deviceId: string, userId?: string) {
  // 1. Request permission
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    // 2. Subscribe to the broadcast topic
    await messaging().subscribeToTopic('all_users');

    // 3. Get device token and register with backend
    const token = await messaging().getToken();
    if (token) {
      await registerToken(token, deviceId, userId);
    }

    // 4. Token refresh listener
    messaging().onTokenRefresh((newToken) => {
      registerToken(newToken, deviceId, userId);
    });

    // 5. Foreground message handler
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification:', remoteMessage.notification);
    });
  }
}

async function registerToken(token: string, deviceId: string, userId?: string) {
  try {
    await axios.post(
      `${API_BASE}/notifications/token`,
      {
        token,
        deviceId,
        userId,
        platform: Platform.OS,
      },
      {
        headers: { 'x-api-key': API_KEY },
      }
    );
  } catch (err) {
    console.error('Failed to register FCM token:', err);
  }
}
```

---

## 6. Part 5: Deep Linking & Notification Payload Schema

When a notification is broadcast from the Prompter Admin Dashboard, the backend constructs an FCM HTTP v1 payload containing both **visual notifications** and **custom data**:

```json
{
  "message": {
    "topic": "all_users",
    "notification": {
      "title": "🔥 50+ New Midjourney Prompts Live!",
      "body": "Explore our curated collection of photorealistic lighting.",
      "image": "https://your-domain.com/uploads/midjourney-banner.png"
    },
    "data": {
      "title": "🔥 50+ New Midjourney Prompts Live!",
      "message": "Explore our curated collection of photorealistic lighting.",
      "deepLink": "prompter://trending",
      "click_action": "FLUTTER_NOTIFICATION_CLICK"
    },
    "android": {
      "priority": "high",
      "notification": {
        "sound": "default",
        "channel_id": "prompter_general_notifications",
        "click_action": "FLUTTER_NOTIFICATION_CLICK"
      }
    },
    "apns": {
      "payload": {
        "aps": {
          "sound": "default",
          "badge": 1,
          "mutable-content": 1
        }
      }
    }
  }
}
```

### Supported Deep Link Formats:
| Deep Link | Target Screen |
|---|---|
| `prompter://trending` | Opens the Trending Prompts tab |
| `prompter://category/{slug}` | Opens prompts filtered by category slug |
| `prompter://prompt/{id}` | Opens the full prompt detail modal |
| `prompter://vip` | Opens the VIP Membership subscription screen |

---

## 7. Troubleshooting & Verification Checklist

- [ ] **Google Service Account Validated**: In Admin Dashboard (`/settings` -> Push Notifications), click **"Test FCM Connection"** and ensure you get a green verified response.
- [ ] **Enable Toggle ON**: Ensure **"Enable Push Notifications Broadcasts"** is toggled ON.
- [ ] **Client App Subscribed**: Ensure client app calls `subscribeToTopic('all_users')` on startup.
- [ ] **Device Token Registered**: Verify `Active Devices` count in dashboard increases when client app launches.
- [ ] **Android Notification Channel Created**: Android 8.0+ requires a notification channel (`prompter_general_notifications`).
- [ ] **iOS APNs Certificate**: In Firebase Console, ensure your Apple Push Notification Service Key (`.p8`) is uploaded under Project Settings → Cloud Messaging.

---

*Prompter FCM Integration Guide — Version 1.0.0*
