# 📱 Prompter Client Application API Documentation

> **Version:** `2.0.0` (Updated)  
> **Protocol:** REST / JSON  
> **Base URL:** `http://localhost:3000` (Development) or `https://yourdomain.com` (Production)  
> **API Version Prefix:** `/api/v1`  
> **Android App Package Name:** `com.codemario.prompter`  
> **Deep Link Scheme:** `prompter://`  
> **Custom Short URL:** `https://yourdomain.com/p/{slug}`  

Welcome to the **Prompter Client API** documentation. These endpoints are designed specifically for consumer client applications (**Android / Kotlin**, **Flutter**, **React Native**, **iOS / Swift**, and **Web**) to consume prompt libraries, category taxonomies, monetization configs, notifications, deep links, and user profiles.

---

## 📑 Table of Contents

1. [Authentication & Security](#1-authentication--security)
2. [Global Standards & Response Structure](#2-global-standards--response-structure)
3. [Deep Linking & Custom Short URLs](#3-deep-linking--custom-short-urls)
   - [Smart Redirect URLs (`/p/{slug}`)](#smart-redirect-urls-pslug)
   - [Android App Links (`/.well-known/assetlinks.json`)](#android-app-links-well-knownassetlinksjson)
4. [API Endpoints Reference](#4-api-endpoints-reference)
   - [4.1 App Configuration (`GET /api/v1/app-config`)](#41-app-configuration)
   - [4.2 Legal, Social & Store URLs (`GET /api/v1/urls`)](#42-legal-social--store-urls)
   - [4.3 Ad Network Configuration (`GET /api/v1/ads`)](#43-ad-network-configuration)
   - [4.4 Category Taxonomy (`GET /api/v1/categories`)](#44-category-taxonomy)
   - [4.5 Subcategories (`GET /api/v1/subcategories`)](#45-subcategories)
   - [4.6 Prompts Feed & Search (`GET /api/v1/prompts`)](#46-prompts-feed--search)
   - [4.7 Prompt Detail (`GET /api/v1/prompts/{id}`)](#47-prompt-detail)
   - [4.8 User Engagement Action (`POST /api/v1/prompts/{id}/action`)](#48-user-engagement-action)
   - [4.9 Dynamic Trending Prompts (`GET /api/v1/trending`)](#49-dynamic-trending-prompts)
   - [4.10 Push Notification Feed (`GET /api/v1/notifications`)](#410-push-notification-feed)
   - [4.11 Register FCM Device Token (`POST /api/v1/notifications/token`)](#411-register-fcm-device-token)
   - [4.12 User Profile Sync (`POST /api/v1/users/sync`)](#412-user-profile-sync)
   - [4.13 Uploaded Files & Images (`GET /uploads/{filename}`)](#413-uploaded-files--images)
5. [Client Integration Guide](#5-client-integration-guide)
   - [Android Manifest Deep Linking Config](#android-manifest-deep-linking-config)
   - [Deterministic Non-Repeating Random Pagination](#deterministic-non-repeating-random-pagination)
   - [User & Device Identification Strategy](#user--device-identification-strategy)
6. [Code Samples](#6-code-samples)
   - [Kotlin (Android Retrofit/OkHttp)](#kotlin-android)
   - [Flutter (Dart / Dio)](#flutter-dart)
   - [cURL](#curl)

---

## 1. Authentication & Security

All `/api/v1/*` endpoints are secured via a static **Client API Key**.

### Required HTTP Headers
```http
x-api-key: YOUR_CLIENT_API_KEY
Content-Type: application/json
Accept: application/json
```

> **Default Development Key:** `prompter_live_sec_7f8a9b1c2d3e4f5a`  
> *(Super Admins can view, regenerate, or toggle API Key enforcement on/off inside the Admin Panel under **Settings** → **Client APIs**).*

### Optional Identification Headers (Recommended for personalization & like states)
| Header | Description | Example |
|---|---|---|
| `x-device-id` | Unique hardware/installation ID of device | `uuid-android-9876-5432-10` |
| `x-user-id` | Signed-in user email or ID | `user@example.com` |

---

## 2. Global Standards & Response Structure

### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Error Response (`4xx / 5xx`)
```json
{
  "success": false,
  "error": "Descriptive error message explaining the failure."
}
```

### Standard HTTP Status Codes
| Code | Meaning | When Returned |
|---|---|---|
| `200` | OK | Request succeeded. |
| `400` | Bad Request | Missing required parameters or invalid body payload. |
| `401` | Unauthorized | Missing or invalid `x-api-key` header. |
| `403` | Forbidden | User account is blocked/suspended. |
| `404` | Not Found | Requested prompt, category, or resource does not exist. |
| `500` | Server Error | Internal server or database error. |

---

## 3. Deep Linking & Custom Short URLs

### Smart Redirect URLs (`/p/{slug}`)

When sharing prompts across WhatsApp, Instagram, Telegram, SMS, or QR codes, always use the short URL format:
```text
https://yourdomain.com/p/{slug}
```

#### Smart Routing Behavior:
1. **If App Installed**: Clicking the link opens the Android app directly via intent filter (`prompter://prompt/{slug}`).
2. **If App NOT Installed**: Opens a fast browser landing page that immediately falls back and redirects to **Google Play Store**:  
   `market://details?id=com.codemario.prompter` (or `https://play.google.com/store/apps/details?id=com.codemario.prompter`).
3. **Rich Social Preview**: Serves OpenGraph and Twitter Cards metadata (prompt title, preview description, featured image).

### Android App Links (`/.well-known/assetlinks.json`)
The server serves official Digital Asset Links at:
```http
GET https://yourdomain.com/.well-known/assetlinks.json
```
Enables Android to verify ownership and open `https://yourdomain.com/p/*` directly in `com.codemario.prompter` without showing the browser chooser dialog.

---

## 4. API Endpoints Reference

---

### 4.1 App Configuration
Retrieve global branding, maintenance mode status, minimum app version, and package identity.

- **Method:** `GET`
- **URL:** `/api/v1/app-config`
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "appName": "Prompter",
    "developerName": "CodeMario",
    "packageName": "com.codemario.prompter",
    "versionName": "1.0.0",
    "versionCode": "100",
    "maintenanceMode": false,
    "appLogo": "https://yourdomain.com/uploads/logo.png",
    "splashLogo": "https://yourdomain.com/uploads/splash.png",
    "appIcon": "https://yourdomain.com/uploads/icon.png",
    "favicon": "/favicon.ico",
    "supportEmail": "support@codemario.com",
    "website": "https://codemario.com",
    "contactNumber": "+1234567890",
    "copyright": "© 2026 CodeMario. All rights reserved.",
    "defaultLanguage": "en",
    "currency": "USD"
  }
}
```

---

### 4.2 Legal, Social & Store URLs
Retrieve official legal policies, data deletion links, and social channel URLs.

- **Method:** `GET`
- **URL:** `/api/v1/urls`
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "privacyPolicy": "https://yourdomain.com/privacy",
    "termsOfService": "https://yourdomain.com/terms",
    "refundPolicy": "https://yourdomain.com/refund",
    "dataDeletionPolicy": "https://yourdomain.com/data-deletion",
    "contactUs": "https://yourdomain.com/contact",
    "aboutUs": "https://yourdomain.com/about",
    "website": "https://yourdomain.com",
    "playStore": "https://play.google.com/store/apps/details?id=com.codemario.prompter",
    "socialLinks": {
      "twitter": "https://twitter.com/prompter",
      "facebook": "https://facebook.com/prompter",
      "instagram": "https://instagram.com/prompter",
      "youtube": "https://youtube.com/@prompter",
      "telegram": "https://t.me/prompter_official"
    }
  }
}
```

---

### 4.3 Ad Network Configuration
Retrieve real-time ad network settings (AdMob, Meta Audience Network, or Unity Ads), ad unit IDs, and frequency caps.

- **Method:** `GET`
- **URL:** `/api/v1/ads`
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "activeProvider": "ADMOB",
    "adsEnabled": true,
    "interstitialInterval": 3,
    "nativeInterval": 5,
    "provider": {
      "providerName": "Google AdMob",
      "appId": "ca-app-pub-3940256099942544~3347511713",
      "bannerUnitId": "ca-app-pub-3940256099942544/6300978111",
      "interstitialUnitId": "ca-app-pub-3940256099942544/1033173712",
      "rewardedUnitId": "ca-app-pub-3940256099942544/5224354917",
      "nativeUnitId": "ca-app-pub-3940256099942544/2247696110",
      "appOpenUnitId": "ca-app-pub-3940256099942544/3419832817"
    }
  }
}
```

---

### 4.4 Category Taxonomy
Retrieve all active categories, nested active subcategories, prompt counts, and direct deep links.

- **Method:** `GET`
- **URL:** `/api/v1/categories`
- **Query Parameters:**
  - `featured=true` *(optional: filter only featured categories)*
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "cat_art_101",
      "title": "Digital Art",
      "slug": "digital-art",
      "image": "https://yourdomain.com/uploads/art.png",
      "position": 1,
      "isFeatured": true,
      "promptCount": 42,
      "subcategories": [
        {
          "id": "sub_3d_201",
          "title": "3D Render & Unreal Engine",
          "slug": "3d-render",
          "image": "https://yourdomain.com/uploads/3d.png",
          "position": 1,
          "promptCount": 18,
          "deepLink": "prompter://category/digital-art/sub/3d-render"
        }
      ],
      "deepLink": "prompter://category/digital-art"
    }
  ]
}
```

---

### 4.5 Subcategories
Retrieve standalone or filtered subcategories with parent category details and prompt counts.

- **Method:** `GET`
- **URL:** `/api/v1/subcategories`
- **Query Parameters:**
  - `category` *(optional: Category ID or Slug to filter)*
  - `search` *(optional: Search string across subcategory titles)*
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "sub_3d_201",
      "title": "3D Render & Unreal Engine",
      "slug": "3d-render",
      "image": "https://yourdomain.com/uploads/3d.png",
      "position": 1,
      "promptCount": 18,
      "category": {
        "id": "cat_art_101",
        "title": "Digital Art",
        "slug": "digital-art"
      },
      "deepLink": "prompter://category/digital-art/sub/3d-render"
    }
  ]
}
```

---

### 4.6 Prompts Feed & Search
Main discovery feed supporting pagination, search, category/subcategory filtering, and deterministic random sorting.

- **Method:** `GET`
- **URL:** `/api/v1/prompts`
- **Query Parameters:**
  - `page` *(default: `1`)*
  - `limit` *(default: `10`, max: `50`)*
  - `category` *(optional: Category ID or Slug)*
  - `subcategory` *(optional: Subcategory ID or Slug)*
  - `search` *(optional: searches prompt title, description, and tags)*
  - `sortBy` *(optional: `latest`, `popular`, `trending`, `views`, `likes`, `random`)*
  - `seed` *(optional: integer seed for deterministic random pagination, e.g. `seed=42`)*
  - `isPremium` *(optional: `true` / `false`)*
  - `isFeatured` *(optional: `true` / `false`)*
  - `deviceId` or `userId` *(optional: checks `isLiked` state)*
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "clt987654321",
      "title": "Cyberpunk Neon Samurai",
      "slug": "cyberpunk-neon-samurai",
      "prompt": "Cinematic portrait of a robotic ronin standing in Tokyo neon rain, 8k octane render, volumetric lighting...",
      "featuredImage": "https://yourdomain.com/uploads/cyberpunk.png",
      "category": {
        "id": "cat_art_101",
        "title": "Digital Art",
        "slug": "digital-art",
        "image": "https://yourdomain.com/uploads/art.png"
      },
      "subcategory": {
        "id": "sub_3d_201",
        "title": "3D Render",
        "slug": "3d-render"
      },
      "tags": ["cyberpunk", "samurai", "neon", "midjourney"],
      "likes": 128,
      "views": 1540,
      "shares": 45,
      "isPremium": false,
      "isFeatured": true,
      "isLiked": false,
      "trendingScore": 84.5,
      "popularScore": 92.1,
      "deepLink": "prompter://prompt/cyberpunk-neon-samurai",
      "shortUrl": "https://yourdomain.com/p/cyberpunk-neon-samurai",
      "shareUrl": "https://yourdomain.com/p/cyberpunk-neon-samurai",
      "createdAt": "2026-11-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 85,
    "totalPages": 9,
    "hasMore": true,
    "seed": 42
  }
}
```

---

### 4.7 Prompt Detail
Retrieve a complete prompt object by ID or unique slug. Includes ready-to-share strings and store metadata.

- **Method:** `GET`
- **URL:** `/api/v1/prompts/{id}` *(where `{id}` is either the prompt ID or Slug)*
- **Query Parameters:**
  - `deviceId` or `userId` *(optional: to check `isLiked`)*
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "clt987654321",
    "title": "Cyberpunk Neon Samurai",
    "slug": "cyberpunk-neon-samurai",
    "prompt": "Cinematic portrait of a robotic ronin standing in Tokyo neon rain, 8k octane render...",
    "featuredImage": "https://yourdomain.com/uploads/cyberpunk.png",
    "tags": ["cyberpunk", "samurai", "neon"],
    "likes": 129,
    "views": 1541,
    "shares": 45,
    "copies": 310,
    "isPremium": false,
    "isFeatured": true,
    "isLiked": true,
    "category": {
      "id": "cat_art_101",
      "title": "Digital Art",
      "slug": "digital-art",
      "image": "https://yourdomain.com/uploads/art.png"
    },
    "subcategory": {
      "id": "sub_3d_201",
      "title": "3D Render",
      "slug": "3d-render"
    },
    "deepLink": "prompter://prompt/cyberpunk-neon-samurai",
    "shortUrl": "https://yourdomain.com/p/cyberpunk-neon-samurai",
    "shareUrl": "https://yourdomain.com/p/cyberpunk-neon-samurai",
    "shareText": "Check out \"Cyberpunk Neon Samurai\" on Prompter:\nhttps://yourdomain.com/p/cyberpunk-neon-samurai",
    "packageName": "com.codemario.prompter",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=com.codemario.prompter",
    "createdAt": "2026-11-01T12:00:00.000Z",
    "updatedAt": "2026-11-02T15:30:00.000Z"
  }
}
```

---

### 4.8 User Engagement Action
Record client-side user events (views, likes, shares, copies). Handles idempotency and like toggling.

- **Method:** `POST`
- **URL:** `/api/v1/prompts/{id}/action`
- **Headers:**
  - `x-api-key: YOUR_KEY`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "type": "like",
  "deviceId": "android-device-uuid-12345",
  "userId": "user@example.com",
  "toggle": true
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | **Yes** | One of: `"like"`, `"unlike"`, `"view"`, `"share"`, `"copy"` |
| `deviceId` | `string` | **Yes** *(or `userId`)* | Device installation identifier |
| `userId` | `string` | Optional | User email or account ID if signed in |
| `toggle` | `boolean`| Optional | If `true` and `type="like"`, automatically un-likes if already liked |

#### Response (`200 OK`)
```json
{
  "success": true,
  "action": "like",
  "isLiked": true,
  "likes": 130,
  "views": 1541,
  "shares": 45,
  "copies": 310
}
```

---

### 4.9 Dynamic Trending Prompts
Retrieve trending prompts calculated in real-time based on weighted user interactions and time decay.

- **Method:** `GET`
- **URL:** `/api/v1/trending`
- **Query Parameters:**
  - `period` *(optional: `today`, `weekly`, `monthly`, `all_time`. Default: highest configured)*
  - `limit` *(optional: prompts count limit, e.g. `20`)*
  - `deviceId` or `userId` *(optional: checks `isLiked`)*
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "period": "today",
  "total": 15,
  "prompts": [
    {
      "id": "clt987654321",
      "title": "Hyper-Realistic Cyber Samurai",
      "slug": "hyper-realistic-cyber-samurai",
      "prompt": "A futuristic warrior...",
      "featuredImage": "https://yourdomain.com/uploads/samurai.png",
      "likes": 240,
      "views": 3200,
      "shares": 85,
      "copies": 510,
      "score": 142.5,
      "deepLink": "prompter://prompt/hyper-realistic-cyber-samurai",
      "shortUrl": "https://yourdomain.com/p/hyper-realistic-cyber-samurai"
    }
  ],
  "groupedByCategory": [
    {
      "category": {
        "id": "cat_art_101",
        "title": "Digital Art",
        "slug": "digital-art"
      },
      "prompts": [ ... ]
    }
  ]
}
```

---

### 4.10 Push Notification Feed
Retrieve past sent push notifications to display in the client app's Notification Center.

- **Method:** `GET`
- **URL:** `/api/v1/notifications`
- **Query Parameters:**
  - `limit` *(default: `20`, max: `50`)*
- **Headers:** `x-api-key: YOUR_KEY`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_881920",
      "title": "🔥 Top Trending Prompts This Week",
      "message": "Explore the most copied Midjourney and ChatGPT prompts right now!",
      "image": "https://yourdomain.com/uploads/banner_trend.png",
      "deepLink": "prompter://trending",
      "sentAt": "2026-11-03T10:00:00.000Z",
      "createdAt": "2026-11-03T09:55:00.000Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

### 4.11 Register FCM Device Token
Register or refresh an Android / iOS Firebase Cloud Messaging device token for targeted and broadcast push notifications.

- **Method:** `POST`
- **URL:** `/api/v1/notifications/token`
- **Headers:**
  - `x-api-key: YOUR_KEY`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "token": "eXample_FCM_Token_982734190823...",
  "deviceId": "android-device-uuid-12345",
  "userId": "user@example.com",
  "platform": "android",
  "appVersion": "1.0.0"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `token` | `string` | **Yes** | FCM registration token from Firebase SDK |
| `deviceId` | `string` | Optional | Device identifier |
| `userId` | `string` | Optional | User ID or email if signed in |
| `platform` | `string` | Optional | `"android"` (default) or `"ios"` |
| `appVersion` | `string` | Optional | Installed app version (e.g. `"1.0.0"`) |

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "FCM device token registered successfully"
}
```

---

### 4.12 User Profile Sync
Synchronize Google Sign-In or social user data with the backend database. Also verifies if user is blocked.

- **Method:** `POST`
- **URL:** `/api/v1/users/sync`
- **Headers:**
  - `x-api-key: YOUR_KEY`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "email": "developer@codemario.com",
  "name": "Mario Code",
  "avatar": "https://lh3.googleusercontent.com/a/sample-photo",
  "appVersion": "1.0.0"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "app_user_44921",
    "email": "developer@codemario.com",
    "name": "Mario Code",
    "avatar": "https://lh3.googleusercontent.com/a/sample-photo",
    "isVip": false,
    "status": "ACTIVE",
    "likesCount": 14,
    "createdAt": "2026-10-15T08:20:00.000Z"
  }
}
```

*(If the user has been banned/suspended by administration, this returns `403 Forbidden` with `"error": "This user account has been suspended by administration."`).*

---

### 4.13 Uploaded Files & Images
Retrieve images and logos stored on the backend.

- **Method:** `GET`
- **URL:** `/uploads/{filename}` *(e.g. `/uploads/1728901234-image.png`)*
- **Headers:** None required (public binary image endpoint).

---

## 5. Client Integration Guide

### Android Manifest Deep Linking Config
Add the following `<intent-filter>` tags to your `MainActivity` in `AndroidManifest.xml` (`package="com.codemario.prompter"`):

```xml
<activity
    android:name=".MainActivity"
    android:exported="true">
    
    <!-- Standard Launcher -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>

    <!-- Custom Scheme Deep Linking: prompter://prompt/{slug} -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="prompter" android:host="prompt" />
        <data android:scheme="prompter" android:host="category" />
    </intent-filter>

    <!-- Verified App Links: https://yourdomain.com/p/{slug} -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https"
              android:host="yourdomain.com"
              android:pathPrefix="/p/" />
        <data android:scheme="https"
              android:host="yourdomain.com"
              android:pathPrefix="/prompt/" />
    </intent-filter>
</activity>
```

### Deterministic Non-Repeating Random Pagination
When implementing infinite scrolling with `sortBy=random`:
1. On **Page 1**, do not pass a `seed` parameter.
2. The server generates a random seed (e.g. `seed: 4281`) and returns it in `pagination.seed`.
3. For all subsequent pages (**Page 2, 3, 4...**), pass the same `seed=4281` query parameter:
   ```http
   GET /api/v1/prompts?sortBy=random&page=2&seed=4281
   ```
4. This guarantees that items are uniquely shuffled across the entire dataset without duplicate prompts appearing across pages.

---

## 6. Code Samples

### Kotlin (Android)

```kotlin
import retrofit2.http.*
import retrofit2.Response

interface PrompterApiService {

    @GET("api/v1/app-config")
    suspend fun getAppConfig(
        @Header("x-api-key") apiKey: String
    ): Response<AppConfigResponse>

    @GET("api/v1/prompts")
    suspend fun getPrompts(
        @Header("x-api-key") apiKey: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10,
        @Query("category") category: String? = null,
        @Query("sortBy") sortBy: String = "latest",
        @Query("seed") seed: Int? = null,
        @Header("x-device-id") deviceId: String
    ): Response<PromptsResponse>

    @POST("api/v1/prompts/{id}/action")
    suspend fun sendEngagementAction(
        @Header("x-api-key") apiKey: String,
        @Path("id") promptId: String,
        @Body action: EngagementRequest
    ): Response<ActionResponse>

    @POST("api/v1/notifications/token")
    suspend fun registerFcmToken(
        @Header("x-api-key") apiKey: String,
        @Body request: FcmTokenRequest
    ): Response<BaseResponse>
}

data class EngagementRequest(
    val type: String, // "like", "view", "share", "copy"
    val deviceId: String,
    val userId: String? = null,
    val toggle: Boolean = true
)

data class FcmTokenRequest(
    val token: String,
    val deviceId: String,
    val platform: String = "android",
    val appVersion: String = "1.0.0"
)
```

---

### Flutter (Dart)

```dart
import 'package:dio/dio.dart';

class PrompterApiClient {
  final Dio _dio;
  final String _apiKey;

  PrompterApiClient({required String baseUrl, required String apiKey})
      : _apiKey = apiKey,
        _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        ));

  /// Fetch prompts feed
  Future<Response> getPrompts({
    int page = 1,
    int limit = 10,
    String? category,
    String sortBy = 'latest',
    int? seed,
    required String deviceId,
  }) async {
    return await _dio.get('/api/v1/prompts', queryParameters: {
      'page': page,
      'limit': limit,
      if (category != null) 'category': category,
      'sortBy': sortBy,
      if (seed != null) 'seed': seed,
      'deviceId': deviceId,
    });
  }

  /// Toggle like action
  Future<Response> toggleLike({
    required String promptId,
    required String deviceId,
    String? userId,
  }) async {
    return await _dio.post('/api/v1/prompts/$promptId/action', data: {
      'type': 'like',
      'deviceId': deviceId,
      'userId': userId,
      'toggle': true,
    });
  }

  /// Register FCM device token
  Future<Response> registerFcmToken({
    required String token,
    required String deviceId,
  }) async {
    return await _dio.post('/api/v1/notifications/token', data: {
      'token': token,
      'deviceId': deviceId,
      'platform': 'android',
      'appVersion': '1.0.0',
    });
  }
}
```

---

### cURL

```bash
# 1. Fetch App Config
curl -X GET "https://yourdomain.com/api/v1/app-config" \
  -H "x-api-key: prompter_live_sec_7f8a9b1c2d3e4f5a"

# 2. Get Prompts Feed (Page 1)
curl -X GET "https://yourdomain.com/api/v1/prompts?page=1&limit=10&sortBy=latest" \
  -H "x-api-key: prompter_live_sec_7f8a9b1c2d3e4f5a" \
  -H "x-device-id: android-test-device-uuid"

# 3. Like a Prompt
curl -X POST "https://yourdomain.com/api/v1/prompts/cyberpunk-neon-samurai/action" \
  -H "x-api-key: prompter_live_sec_7f8a9b1c2d3e4f5a" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "like",
    "deviceId": "android-test-device-uuid",
    "toggle": true
  }'

# 4. Register FCM Token
curl -X POST "https://yourdomain.com/api/v1/notifications/token" \
  -H "x-api-key: prompter_live_sec_7f8a9b1c2d3e4f5a" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eXample_FCM_Token_12345",
    "deviceId": "android-test-device-uuid",
    "platform": "android",
    "appVersion": "1.0.0"
  }'
```
