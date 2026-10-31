# 📱 Client App Integration Guide: Dynamic Trending Prompts

This guide is designed for **mobile and frontend developers** (Flutter, Android/Kotlin, iOS/Swift, React Native) integrating the **Dynamic Trending Prompts System** into the consumer client app.

---

## 📑 Table of Contents

1. [Quick Overview](#1-quick-overview)
2. [Authentication & Device Identification](#2-authentication--device-identification)
3. [Core Workflow: Displaying Trending Prompts](#3-core-workflow-displaying-trending-prompts)
   - [Approach A: Fetch All 4 Categories for Home Screen](#approach-a-fetch-all-4-categories-for-home-screen)
   - [Approach B: Fetch Single Period for Dedicated Tabs](#approach-b-fetch-single-period-for-dedicated-tabs)
4. [Action Tracking: Feeding the Algorithm](#4-action-tracking-feeding-the-algorithm)
   - [When to Send Each Action](#when-to-send-each-action)
   - [How to Send Action Requests](#how-to-send-action-requests)
5. [UI / UX Guidelines](#5-ui--ux-guidelines)
   - [Rank Podium Badges](#rank-podium-badges)
   - [Trending Score & Activity Breakdown](#trending-score--activity-breakdown)
   - [Optimistic Like Toggle](#optimistic-like-toggle)
6. [Ready-to-Use Code Implementations](#6-ready-to-use-code-implementations)
   - [Flutter / Dart](#61-flutter--dart)
   - [Android (Kotlin + Retrofit)](#62-android-kotlin--retrofit)
   - [iOS (Swift + URLSession)](#63-ios-swift--urlsession)
   - [React Native / TypeScript](#64-react-native--typescript)
7. [Checklist for Mobile Developers](#7-checklist-for-mobile-developers)

---

## 1. Quick Overview

The Prompter backend divides trending prompts into **4 independent time horizons**:

1. **`today`** — Most popular prompts during the current calendar day (from 00:00:00).
2. **`weekly`** — Most popular prompts during the current week (from Monday 00:00:00).
3. **`monthly`** — Most popular prompts during the current month (from 1st of the month 00:00:00).
4. **`all_time`** — Cumulative all-time ranking since publication.

Each category has its own separate ranking based on the formula:

$$\text{Score} = (\text{Views} \times 1.0) + (\text{Likes} \times 3.0) + (\text{Copies} \times 5.0) + (\text{Shares} \times 4.0)$$

All calculations and timezone boundaries are resolved **server-side**. Your client app only needs to fetch the data and display it.

---

## 2. Authentication & Device Identification

Every request requires your Client API Key and a unique device identifier:

### Required HTTP Headers:
| Header | Value | Description |
|---|---|---|
| `x-api-key` | `YOUR_CLIENT_API_KEY` | Client API key provided in the Admin Panel |
| `x-device-id` | `UUID string` | Persistent client UUID stored in app `SharedPreferences` / `Keychain` |
| `x-user-id` | `email` or `userId` *(Optional)* | User identifier if signed in via Google Sign-In |

> 💡 **Tip**: Generate a UUID on first app launch and persist it locally:
> - **Flutter**: `shared_preferences`
> - **Android**: `EncryptedSharedPreferences`
> - **iOS**: `Keychain` / `UserDefaults`

---

## 3. Core Workflow: Displaying Trending Prompts

### Approach A: Fetch All 4 Categories for Home Screen

Use this when displaying horizontal carousels on your app's **Home** or **Discover** screen.

```http
GET /api/v1/trending?limit=10
Headers:
  x-api-key: YOUR_CLIENT_API_KEY
  x-device-id: 3c9b1f28-8d4e-4e6f-b2a1-9c8e7f6a5b4c
```

#### Response Structure:
```json
{
  "success": true,
  "data": {
    "today": [ /* Top 10 prompts for today */ ],
    "weekly": [ /* Top 10 prompts for this week */ ],
    "monthly": [ /* Top 10 prompts for this month */ ],
    "all_time": [ /* Top 10 prompts of all time */ ]
  },
  "meta": {
    "sectionsEnabled": {
      "today": true,
      "weekly": true,
      "monthly": true,
      "all_time": true
    }
  }
}
```

> ⚠️ **Check `meta.sectionsEnabled`**: The admin can disable any of the 4 sections from the admin panel. If `sectionsEnabled.today == false`, hide the Today's Trending carousel in the UI.

---

### Approach B: Fetch Single Period for Dedicated Tabs

Use this on a dedicated **"Trending" screen** with 4 tabs: `[ Today | This Week | This Month | All-Time ]`.

```http
GET /api/v1/trending?period=today&limit=20
Headers:
  x-api-key: YOUR_CLIENT_API_KEY
  x-device-id: 3c9b1f28-8d4e-4e6f-b2a1-9c8e7f6a5b4c
```

Valid values for `period`:
- `today`
- `weekly`
- `monthly`
- `all_time`

#### Response Structure:
```json
{
  "success": true,
  "category": "today",
  "isEnabled": true,
  "prompts": [
    {
      "id": "cmtl3wkpo000u8trf6k7s9b8v",
      "title": "Full-Stack Next.js 14 Clean Architecture Blueprint",
      "slug": "full-stack-next-js-14-clean-architecture-blueprint",
      "prompt": "Act as a Principal Software Architect...",
      "featuredImage": "/uploads/nextjs-arch.png",
      "category": {
        "id": "cmtl3wkmy00048trf3otdjmh4",
        "title": "Coding & Architecture",
        "slug": "coding-architecture"
      },
      "tags": ["nextjs", "react", "architecture"],
      "likes": 841,
      "views": 18200,
      "copies": 532,
      "shares": 310,
      "isLiked": false,
      "score": 48.0,
      "rank": 1,
      "periodActivity": {
        "views": 18,
        "likes": 5,
        "copies": 3,
        "shares": 0
      }
    }
  ]
}
```

---

## 4. Action Tracking: Feeding the Algorithm

The backend calculates trending rankings in real time from **user engagement events**. For trending to work dynamically, the client app **must** send user actions to:

`POST /api/v1/prompts/{id}/action`

### When to Send Each Action:

| Event in App | Action Type | Payload | Notes |
|---|---|---|---|
| User opens/reads prompt card | `"view"` | `{"type": "view"}` | Deduplicated by backend (max 1 count per 15 min). |
| User taps Heart / Like | `"like"` | `{"type": "like", "toggle": true}` | Backend toggles state and updates `isLiked`. Strictly 1 like per device. |
| User taps "Copy Prompt" button | `"copy"` | `{"type": "copy"}` | High-intent action (carries highest default weight: $5\times$). |
| User taps "Share" button | `"share"` | `{"type": "share"}` | External viral metric ($4\times$). |

---

### How to Send Action Requests:

```http
POST /api/v1/prompts/cmtl3wkpo000u8trf6k7s9b8v/action
Headers:
  x-api-key: YOUR_CLIENT_API_KEY
  Content-Type: application/json
Body:
{
  "type": "like",
  "toggle": true,
  "deviceId": "3c9b1f28-8d4e-4e6f-b2a1-9c8e7f6a5b4c",
  "userId": "user@gmail.com"
}
```

#### Action Response (`200 OK`):
```json
{
  "success": true,
  "action": "like",
  "isLiked": true,
  "likes": 842,
  "views": 18200,
  "copies": 532,
  "shares": 310,
  "trendingScore": 51.0,
  "popularScore": 19884
}
```

---

## 5. UI / UX Guidelines

### Rank Podium Badges
Each prompt object includes a `rank` integer (`1, 2, 3, 4, ...`). Style the top 3 with distinctive podium medals:
- **`rank == 1`**: 🥇 Gold badge (`#F59E0B` / Amber)
- **`rank == 2`**: 🥈 Silver badge (`#94A3B8` / Slate)
- **`rank == 3`**: 🥉 Bronze badge (`#D97706` / Bronze)
- **`rank > 3`**: Minimalist pill `#4, #5, #6...`

### Trending Score & Activity Breakdown
In each prompt item, you have access to:
- `prompt.score` or `prompt.trendingScore`: The calculated momentum score (e.g., `48.0`).
- `prompt.periodActivity`: Counts accumulated within that specific period:
  - `periodActivity.views`
  - `periodActivity.likes`
  - `periodActivity.copies`
  - `periodActivity.shares`

Display a badge such as: `🔥 48 pts • 3 copies today`.

### Optimistic Like Toggle
When the user taps the Like button:
1. Immediately toggle the local UI state (`isLiked = !isLiked`, increment/decrement `likes` count).
2. Fire `POST /api/v1/prompts/{id}/action` in the background with `type: "like", toggle: true`.
3. If the network call fails, revert the local state and display a toast.

---

## 6. Ready-to-Use Code Implementations

### 6.1 Flutter / Dart

#### Data Models (`trending_model.dart`):
```dart
class TrendingPrompt {
  final String id;
  final String title;
  final String slug;
  final String prompt;
  final String? featuredImage;
  final int likes;
  final int views;
  final int copies;
  final int shares;
  final bool isLiked;
  final double score;
  final int rank;

  TrendingPrompt({
    required this.id,
    required this.title,
    required this.slug,
    required this.prompt,
    this.featuredImage,
    required this.likes,
    required this.views,
    required this.copies,
    required this.shares,
    required this.isLiked,
    required this.score,
    required this.rank,
  });

  factory TrendingPrompt.fromJson(Map<String, dynamic> json) {
    return TrendingPrompt(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      prompt: json['prompt'] ?? '',
      featuredImage: json['featuredImage'],
      likes: json['likes'] ?? 0,
      views: json['views'] ?? 0,
      copies: json['copies'] ?? 0,
      shares: json['shares'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      rank: json['rank'] ?? 0,
    );
  }
}
```

#### API Service (`trending_service.dart`):
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class TrendingService {
  final String baseUrl;
  final String apiKey;
  final String deviceId;
  final String? userId;

  TrendingService({
    required this.baseUrl,
    required this.apiKey,
    required this.deviceId,
    this.userId,
  });

  Map<String, String> get _headers => {
    'x-api-key': apiKey,
    'x-device-id': deviceId,
    if (userId != null) 'x-user-id': userId!,
    'Content-Type': 'application/json',
  };

  // 1. Fetch All 4 Categories for Home Screen
  async Future<Map<String, List<TrendingPrompt>>> fetchAllTrending({int limit = 10}) async {
    final uri = Uri.parse('$baseUrl/api/v1/trending?limit=$limit');
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final jsonBody = json.decode(response.body);
      final data = jsonBody['data'] as Map<String, dynamic>;

      return data.map((key, list) => MapEntry(
        key,
        (list as List).map((p) => TrendingPrompt.fromJson(p)).toList(),
      ));
    } else {
      throw Exception('Failed to load trending prompts: ${response.statusCode}');
    }
  }

  // 2. Fetch Single Period for Tab Screen (e.g. "today")
  async Future<List<TrendingPrompt>> fetchByPeriod(String period, {int limit = 20}) async {
    final uri = Uri.parse('$baseUrl/api/v1/trending?period=$period&limit=$limit');
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final jsonBody = json.decode(response.body);
      final list = jsonBody['prompts'] as List? ?? [];
      return list.map((p) => TrendingPrompt.fromJson(p)).toList();
    } else {
      throw Exception('Failed to load $period trending');
    }
  }

  // 3. Record User Action (view, like, copy, share)
  async Future<bool> recordAction(String promptId, String actionType, {bool toggle = false}) async {
    final uri = Uri.parse('$baseUrl/api/v1/prompts/$promptId/action');
    final body = json.encode({
      'type': actionType,
      'deviceId': deviceId,
      if (userId != null) 'userId': userId,
      if (toggle) 'toggle': true,
    });

    final response = await http.post(uri, headers: _headers, body: body);
    return response.statusCode == 200;
  }
}
```

---

### 6.2 Android (Kotlin + Retrofit)

#### Retrofit Interface:
```kotlin
import retrofit2.Response
import retrofit2.http.*

interface PrompterApi {
    @GET("api/v1/trending")
    suspend fun getTrendingAll(
        @Header("x-api-key") apiKey: String,
        @Header("x-device-id") deviceId: String,
        @Header("x-user-id") userId: String? = null,
        @Query("limit") limit: Int = 10
    ): Response<TrendingAllResponse>

    @GET("api/v1/trending")
    suspend fun getTrendingPeriod(
        @Header("x-api-key") apiKey: String,
        @Header("x-device-id") deviceId: String,
        @Query("period") period: String, // "today", "weekly", "monthly", "all_time"
        @Query("limit") limit: Int = 20
    ): Response<TrendingPeriodResponse>

    @POST("api/v1/prompts/{id}/action")
    suspend fun recordAction(
        @Header("x-api-key") apiKey: String,
        @Path("id") promptId: String,
        @Body request: ActionRequest
    ): Response<ActionResponse>
}

// Data Models
data class ActionRequest(
    val type: String, // "view", "like", "copy", "share"
    val deviceId: String,
    val userId: String? = null,
    val toggle: Boolean = false
)

data class TrendingAllResponse(
    val success: Boolean,
    val data: TrendingCategories
)

data class TrendingCategories(
    val today: List<TrendingPrompt>,
    val weekly: List<TrendingPrompt>,
    val monthly: List<TrendingPrompt>,
    @SerializedName("all_time") val allTime: List<TrendingPrompt>
)

data class TrendingPeriodResponse(
    val success: Boolean,
    val category: String,
    val prompts: List<TrendingPrompt>
)

data class TrendingPrompt(
    val id: String,
    val title: String,
    val slug: String,
    val prompt: String,
    val featuredImage: String?,
    val likes: Int,
    val views: Int,
    val copies: Int,
    val shares: Int,
    val isLiked: Boolean,
    val score: Double,
    val rank: Int
)
```

---

### 6.3 iOS (Swift + URLSession)

```swift
import Foundation

struct TrendingPrompt: Codable, Identifiable {
    let id: String
    let title: String
    let slug: String
    let prompt: String
    let featuredImage: String?
    let likes: Int
    let views: Int
    let copies: Int
    let shares: Int
    let isLiked: Bool
    let score: Double
    let rank: Int
}

class TrendingService {
    let baseURL: URL
    let apiKey: String
    let deviceId: String

    init(baseURL: URL, apiKey: String, deviceId: String) {
        self.baseURL = baseURL
        self.apiKey = apiKey
        self.deviceId = deviceId
    }

    private func createRequest(path: String, method: String = "GET") -> URLRequest {
        let url = baseURL.appendingPathComponent(path)
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        req.setValue(deviceId, forHTTPHeaderField: "x-device-id")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return req
    }

    // 1. Fetch Trending for a Period ("today", "weekly", "monthly", "all_time")
    func fetchTrending(period: String? = nil, limit: Int = 10) async throws -> [TrendingPrompt] {
        var components = URLComponents(url: baseURL.appendingPathComponent("api/v1/trending"), resolvingAgainstBaseURL: true)!
        var queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]
        if let period = period {
            queryItems.append(URLQueryItem(name: "period", value: period))
        }
        components.queryItems = queryItems

        var req = URLRequest(url: components.url!)
        req.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        req.setValue(deviceId, forHTTPHeaderField: "x-device-id")

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let httpRes = response as? HTTPURLResponse, httpRes.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        guard let promptList = json["prompts"] as? [[String: Any]] else { return [] }

        let promptData = try JSONSerialization.data(withJSONObject: promptList)
        return try JSONDecoder().decode([TrendingPrompt].self, from: promptData)
    }

    // 2. Fire Action (view, like, copy, share)
    func recordAction(promptId: String, type: String, toggle: Bool = false) async throws {
        var req = createRequest(path: "api/v1/prompts/\(promptId)/action", method: "POST")
        let payload: [String: Any] = [
            "type": type,
            "deviceId": deviceId,
            "toggle": toggle
        ]
        req.httpBody = try JSONSerialization.data(withJSONObject: payload)
        _ = try await URLSession.shared.data(for: req)
    }
}
```

---

### 6.4 React Native / TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'https://your-domain.com/api/v1';
const API_KEY = 'YOUR_CLIENT_API_KEY';

export const trendingClient = (deviceId: string, userId?: string) => {
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      'x-api-key': API_KEY,
      'x-device-id': deviceId,
      ...(userId ? { 'x-user-id': userId } : {}),
    },
  });

  return {
    // 1. Fetch All Categories for Home Screen
    getAllTrending: async (limit = 10) => {
      const res = await client.get(`/trending?limit=${limit}`);
      return res.data;
    },

    // 2. Fetch Single Tab (today, weekly, monthly, all_time)
    getByPeriod: async (period: 'today' | 'weekly' | 'monthly' | 'all_time', limit = 20) => {
      const res = await client.get(`/trending?period=${period}&limit=${limit}`);
      return res.data.prompts;
    },

    // 3. Register User Action (like, view, copy, share)
    recordAction: async (promptId: string, type: 'view' | 'like' | 'copy' | 'share', toggle = false) => {
      const res = await client.post(`/prompts/${promptId}/action`, {
        type,
        deviceId,
        userId,
        toggle,
      });
      return res.data;
    },
  };
};
```

---

## 7. Checklist for Mobile Developers

Before releasing your client app update:

- [ ] **Header Configured**: `x-api-key` is included in all API calls.
- [ ] **Device ID Persistent**: Generated UUID stored in persistent storage and passed in `x-device-id`.
- [ ] **Section Toggles Respected**: Code checks `meta.sectionsEnabled` before displaying each trending section.
- [ ] **View Event Hooked**: Opened prompt detail screen calls `POST .../action` with `type: "view"`.
- [ ] **Like Button Hooked**: Heart icon calls `POST .../action` with `type: "like", toggle: true` and optimistic update.
- [ ] **Copy Button Hooked**: Copy button calls `POST .../action` with `type: "copy"`.
- [ ] **Share Button Hooked**: Share action calls `POST .../action` with `type: "share"`.
- [ ] **Podium Badges Rendered**: Ranks 1, 2, and 3 display gold, silver, and bronze badges.
- [ ] **Pull-to-Refresh**: Trending list refreshes on pull down.

---

*Prompter Client Integration Guide — Version 1.0.0*
