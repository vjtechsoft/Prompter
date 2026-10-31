# 📈 Dynamic Trending Prompts API Implementation Documentation

This document provides a comprehensive technical reference for the **Dynamic Trending Prompts System** in Prompter, covering architectural design, ranking algorithms, database schemas, client & admin API endpoints, caching mechanisms, and client integration snippets (cURL, JavaScript, Kotlin, Swift).

---

## 📑 Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [The 4 Trending Categories & Time Boundaries](#2-the-4-trending-categories--time-boundaries)
3. [Weighted Ranking Formula & Algorithm](#3-weighted-ranking-formula--algorithm)
4. [Database Schema & Event Tracking](#4-database-schema--event-tracking)
5. [Client API Reference](#5-client-api-reference)
   - [`GET /api/v1/trending` — Fetch Trending Prompts](#51-get-apiv1trending--fetch-trending-prompts)
   - [`POST /api/v1/prompts/:id/action` — Register User Activity](#52-post-apiv1promptsidaction--register-user-activity)
6. [Admin Management API Reference](#6-admin-management-api-reference)
   - [`GET /api/trending` — Admin Dashboard Trending Overview](#61-get-apitrending--admin-dashboard-trending-overview)
   - [`GET /api/trending/settings` — Read Algorithm Settings](#62-get-apitrendingsettings--read-algorithm-settings)
   - [`POST /api/trending/settings` — Update Algorithm Settings](#63-post-apitrendingsettings--update-algorithm-settings)
   - [`POST /api/trending/refresh` — Invalidate Cache & Recalculate](#64-post-apitrendingrefresh--invalidate-cache--recalculate)
7. [Caching & Performance Optimization](#7-caching--performance-optimization)
8. [Strict Content Eligibility Filters](#8-strict-content-eligibility-filters)
9. [Client Integration Examples](#9-client-integration-examples)
   - [cURL](#91-curl)
   - [JavaScript / TypeScript (Fetch API)](#92-javascript--typescript-fetch-api)
   - [Android (Kotlin + Retrofit / OkHttp)](#93-android-kotlin--retrofit--okhttp)
   - [iOS (Swift + URLSession)](#94-ios-swift--urlsession)
10. [Error Handling & Status Codes](#10-error-handling--status-codes)

---

## 1. Architectural Overview

The Trending Prompts system calculates viral momentum and historical popularity dynamically on the backend. Client applications never compute scores locally; instead, they query high-performance backend endpoints that return ranked prompt lists alongside activity statistics.

```
                    ┌──────────────────────────┐
                    │ Client App (iOS/Android) │
                    └────────────┬─────────────┘
                                 │
           1. User Interactions │ 2. Query Trending
       (view, like, copy, share) │    (/api/v1/trending)
                                 ▼
                    ┌──────────────────────────┐
                    │  Next.js Serverless API  │
                    │   (/api/v1/prompts/...   │
                    │    /api/v1/trending)     │
                    └──────┬────────────┬──────┘
                           │            │
             Write Activity│            │ Check In-Memory Cache
             & Invalidate  │            │ (TTL: 30s)
                           ▼            ▼
             ┌─────────────────────────────┐
             │    PostgreSQL Database      │
             │  - PromptActivity (Indexed) │
             │  - PromptLike               │
             │  - TrendingSetting          │
             └─────────────────────────────┘
```

### Core Design Principles:
1. **Zero Client-Side Calculation**: All ranking, aggregation, and timezone logic are executed strictly server-side.
2. **Timezone Accuracy**: Time boundaries (Today, Weekly, Monthly) use the application's configured timezone (`AppSettings.timezone`, default `UTC`).
3. **Sub-millisecond Cached Reads**: High-traffic endpoints serve from an in-memory TTL cache (30 seconds) that is automatically invalidated upon user actions.
4. **Strict Content Hygiene**: Inactive, deleted, or unapproved prompts (or prompts under inactive categories/subcategories) are automatically excluded.

---

## 2. The 4 Trending Categories & Time Boundaries

| Category | Key | Time Horizon | Activity Source |
|---|---|---|---|
| **Today Trending** | `today` | Current calendar day from `00:00:00` | `PromptActivity` events where `createdAt >= todayStart` |
| **Weekly Trending** | `weekly` | Current ISO calendar week from Monday `00:00:00` | `PromptActivity` events where `createdAt >= weeklyStart` |
| **Monthly Trending** | `monthly` | Current calendar month from Day 1 `00:00:00` | `PromptActivity` events where `createdAt >= monthlyStart` |
| **All-Time Trending** | `all_time` | All historical prompt activity | Cumulative lifetime metrics (`Prompt.views`, `likes`, `copies`, `shares`) |

### Timezone Calculation Logic (`src/lib/trending.ts`):
```typescript
// Computes boundaries using Intl.DateTimeFormat in target timezone
const { todayStart, weeklyStart, monthlyStart, timezone } = getPeriodDateRanges(configuredTimezone);
```
- **Today Start**: `now - msElapsedSinceMidnight(timezone)`
- **Weekly Start**: `todayStart - daysSinceMonday * 86,400,000ms` (ISO 8601 standard, Monday start)
- **Monthly Start**: `todayStart - (dayOfMonth - 1) * 86,400,000ms`

---

## 3. Weighted Ranking Formula & Algorithm

The popularity score is calculated using configurable weights stored in the database:

$$\text{Trending Score} = (\text{Views} \times W_v) + (\text{Likes} \times W_l) + (\text{Copies} \times W_c) + (\text{Shares} \times W_s)$$

### Default Weights:
| Action | Variable | Default Weight | Description |
|---|---|---|---|
| **Views** | $W_v$ | `1.0` | Passive impression / read |
| **Likes** | $W_l$ | `3.0` | Explicit positive endorsement |
| **Copies** | $W_c$ | `5.0` | Highest intent; prompt utilized in AI tool |
| **Shares** | $W_s$ | `4.0` | Viral external distribution |

> 💡 *Admins can modify these weights anytime in the Admin Panel (`/trending` -> Algorithm Settings) or via `POST /api/trending/settings` without code redeployment.*

### Tie-Breaking Priority:
If two prompts have identical scores:
1. `score DESC`
2. `periodLikes DESC`
3. `periodViews DESC`
4. `createdAt DESC` (Newer prompts win)

---

## 4. Database Schema & Event Tracking

Implemented in PostgreSQL via Prisma (`prisma/schema.prisma`):

### 1. `PromptActivity` (Event Log for Time-Window Aggregations)
```prisma
model PromptActivity {
  id               String   @id @default(cuid())
  promptId         String
  prompt           Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
  type             String   // "view" | "like" | "share" | "copy"
  clientIdentifier String?  // "user:${userId}" | "device:${deviceId}" | "ip:${ip}"
  createdAt        DateTime @default(now())

  @@index([promptId, type, createdAt])
  @@index([type, createdAt])
  @@index([createdAt])
  @@index([promptId, createdAt])
}
```

### 2. `PromptLike` (Guaranteed 1-Like-Per-User Constraint)
```prisma
model PromptLike {
  id               String   @id @default(cuid())
  promptId         String
  prompt           Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
  clientIdentifier String   // "user:${userId}" | "device:${deviceId}"
  userId           String?  // Optional AppUser ID
  createdAt        DateTime @default(now())

  @@unique([promptId, clientIdentifier])
  @@index([promptId])
  @@index([clientIdentifier])
}
```

### 3. `TrendingSetting` (Configurable Parameters)
```prisma
model TrendingSetting {
  id                    String   @id @default("default")
  weightViews           Float    @default(1.0)
  weightLikes           Float    @default(3.0)
  weightCopies          Float    @default(5.0)
  weightShares          Float    @default(4.0)
  maxPromptsPerCategory Int      @default(10)
  enableToday           Boolean  @default(true)
  enableWeekly          Boolean  @default(true)
  enableMonthly         Boolean  @default(true)
  enableAllTime         Boolean  @default(true)
  minScoreThreshold     Float    @default(0.0)
  updatedAt             DateTime @updatedAt
}
```

---

## 5. Client API Reference

### 5.1 `GET /api/v1/trending` — Fetch Trending Prompts

Fetches dynamically ranked trending prompts. By default, returns all 4 categories in a single concurrent request. Alternatively, client apps can request a single category using `?period=...`.

#### Authentication:
| Header | Type | Required | Description |
|---|---|---|---|
| `x-api-key` | string | Yes | Client API Key (configured in Admin Settings) |

#### Query Parameters:
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `period` | string | No | `null` (All 4) | Filter by specific period: `"today"`, `"weekly"`, `"monthly"`, `"all_time"`. |
| `limit` | integer | No | Config (`10`) | Maximum prompts returned per category (1 - 100). |
| `userId` | string | No | `null` | Google user email or database ID to determine personalized `isLiked` status. |
| `deviceId` | string | No | `null` | Mobile hardware UUID to determine personalized `isLiked` status if user is guest. |

#### Request Headers for User Personalization:
Instead of query params, `userId` and `deviceId` can also be passed via HTTP headers:
- `x-user-id` or `x-client-user-id`
- `x-device-id` or `x-client-id`

---

#### Response Format A: All 4 Categories (Default)
`GET /api/v1/trending?limit=5`

```json
{
  "success": true,
  "data": {
    "today": [
      {
        "id": "cmtl3wkpo000u8trf6k7s9b8v",
        "title": "Full-Stack Next.js 14 Clean Architecture Blueprint",
        "slug": "full-stack-next-js-14-clean-architecture-blueprint",
        "prompt": "Act as a Principal Software Architect...",
        "featuredImage": "/uploads/nextjs-arch.png",
        "category": {
          "id": "cmtl3wkmy00048trf3otdjmh4",
          "title": "Coding & Architecture",
          "slug": "coding-architecture",
          "image": "/uploads/coding.png"
        },
        "subcategory": null,
        "tags": ["nextjs", "react", "architecture"],
        "likes": 841,
        "views": 18200,
        "shares": 310,
        "copies": 532,
        "isPremium": false,
        "isFeatured": true,
        "isLiked": false,
        "score": 48.0,
        "rank": 1,
        "periodActivity": {
          "views": 18,
          "likes": 5,
          "copies": 3,
          "shares": 0
        },
        "createdAt": "2026-09-01T10:15:00.000Z",
        "updatedAt": "2026-10-27T18:20:00.000Z"
      }
    ],
    "weekly": [ /* Array of ranked prompts for current week */ ],
    "monthly": [ /* Array of ranked prompts for current month */ ],
    "all_time": [ /* Array of ranked prompts for all-time */ ]
  },
  "meta": {
    "timezone": "UTC",
    "weights": {
      "views": 1.0,
      "likes": 3.0,
      "copies": 5.0,
      "shares": 4.0
    },
    "limits": {
      "today": 5,
      "weekly": 5,
      "monthly": 5,
      "all_time": 5
    },
    "sectionsEnabled": {
      "today": true,
      "weekly": true,
      "monthly": true,
      "all_time": true
    },
    "periodRanges": {
      "today": {
        "start": "2026-10-31T00:00:00.000Z",
        "end": "2026-10-31T17:00:00.000Z"
      },
      "weekly": {
        "start": "2026-10-26T00:00:00.000Z",
        "end": "2026-10-31T17:00:00.000Z"
      },
      "monthly": {
        "start": "2026-10-01T00:00:00.000Z",
        "end": "2026-10-31T17:00:00.000Z"
      }
    },
    "generatedAt": "2026-10-31T17:00:00.000Z"
  }
}
```

---

#### Response Format B: Single Period Query
`GET /api/v1/trending?period=today&limit=10`

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
        "slug": "coding-architecture",
        "image": "/uploads/coding.png"
      },
      "tags": ["nextjs", "react", "architecture"],
      "likes": 841,
      "views": 18200,
      "shares": 310,
      "copies": 532,
      "isPremium": false,
      "isFeatured": true,
      "isLiked": false,
      "score": 48.0,
      "rank": 1,
      "periodActivity": {
        "views": 18,
        "likes": 5,
        "copies": 3,
        "shares": 0
      },
      "createdAt": "2026-09-01T10:15:00.000Z",
      "updatedAt": "2026-10-27T18:20:00.000Z"
    }
  ],
  "meta": {
    "timezone": "UTC",
    "periodRange": {
      "start": "2026-10-31T00:00:00.000Z",
      "end": "2026-10-31T17:00:00.000Z"
    },
    "weights": {
      "views": 1.0,
      "likes": 3.0,
      "copies": 5.0,
      "shares": 4.0
    },
    "limit": 10,
    "generatedAt": "2026-10-31T17:00:00.000Z"
  }
}
```

---

### 5.2 `POST /api/v1/prompts/:id/action` — Register User Activity

Every user interaction feeds directly into the trending calculation engine. Calling this endpoint records a `PromptActivity` entry, updates the prompt's cumulative counter, and **automatically invalidates the trending cache**.

#### Endpoint:
`POST /api/v1/prompts/:id/action` (`:id` can be prompt `id` or `slug`)

#### Headers:
| Header | Type | Required | Description |
|---|---|---|---|
| `x-api-key` | string | Yes | Client API authentication key |
| `Content-Type` | string | Yes | `application/json` |

#### Request Body:
```json
{
  "type": "like",
  "userId": "sarah.jenkins@gmail.com",
  "deviceId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "toggle": true
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | Yes | `"like"`, `"unlike"`, `"view"`, `"copy"`, or `"share"` |
| `userId` | string | Optional | Unique user ID or email |
| `deviceId` | string | Optional | Mobile client device UUID |
| `toggle` | boolean | Optional | If `true` and `type="like"`, unlikes if already liked |

#### Deduplication & Integrity Rules:
- **`view` (Deduplicated)**: Rate-limited to 1 counted view per client fingerprint per 15 minutes. Prevents rapid reload abuse.
- **`like` / `unlike` (Strictly Unique)**: Enforced via unique compound constraint `[promptId, clientIdentifier]` in table `PromptLike`. Submitting multiple likes from the same user/device will not inflate the counter.
- **`copy` & `share` (Atomic Increments)**: Atomically increments the counter and writes an activity record.

#### Response (`200 OK`):
```json
{
  "success": true,
  "action": "like",
  "isLiked": true,
  "likes": 842,
  "views": 18200,
  "shares": 310,
  "copies": 532,
  "trendingScore": 48.0,
  "popularScore": 19884
}
```

---

## 6. Admin Management API Reference

Admin endpoints are protected by the Next.js session authentication (`jwt` / session cookies).

### 6.1 `GET /api/trending` — Admin Dashboard Trending Overview
Fetches ranked results for all 4 periods, active algorithm configuration, and system-wide activity statistics.

#### Query Parameters:
- `refresh=true`: Forces cache purge and live recalculation.
- `period=today|weekly|monthly|all_time`: Optional period filter.
- `limit=20`: Optional limit per category.

#### Response (`200 OK`):
```json
{
  "success": true,
  "config": {
    "weightViews": 1.0,
    "weightLikes": 3.0,
    "weightCopies": 5.0,
    "weightShares": 4.0,
    "maxPromptsPerCategory": 10,
    "enableToday": true,
    "enableWeekly": true,
    "enableMonthly": true,
    "enableAllTime": true,
    "minScoreThreshold": 0.0
  },
  "activityStats": {
    "todayCount": 142,
    "weeklyCount": 1890,
    "monthlyCount": 7820,
    "totalCount": 24500,
    "timezone": "UTC"
  },
  "trending": { /* All 4 categories with rankings */ }
}
```

---

### 6.2 `GET /api/trending/settings` — Read Algorithm Settings
Returns the active configuration object.

---

### 6.3 `POST /api/trending/settings` — Update Algorithm Settings
Updates configuration and immediately purges all in-memory caches.

#### Request Body (`application/json`):
```json
{
  "weightViews": 1.0,
  "weightLikes": 3.5,
  "weightCopies": 5.0,
  "weightShares": 4.0,
  "maxPromptsPerCategory": 15,
  "enableToday": true,
  "enableWeekly": true,
  "enableMonthly": true,
  "enableAllTime": true,
  "minScoreThreshold": 2.0
}
```

#### Validation:
- All weights must be non-negative floats ($\ge 0$).
- `maxPromptsPerCategory` is clamped between `1` and `100`.
- `minScoreThreshold` must be $\ge 0$.

---

### 6.4 `POST /api/trending/refresh` — Invalidate Cache & Recalculate
Triggers an immediate cache flush and forces an on-demand SQL aggregation.

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "Trending cache recalculated and refreshed successfully",
  "data": { /* Freshly calculated rankings */ }
}
```

---

## 7. Caching & Performance Optimization

To deliver response times under **15ms** even with tens of thousands of recorded events:

1. **In-Memory TTL Cache**:
   - Cache key includes period, limits, and user/device identifiers:
     `trending:${period}:${limit}:${userId}:${deviceId}`
   - Time-To-Live (TTL): **30 seconds**.
2. **Event-Driven Cache Invalidation**:
   - Calling `POST /api/v1/prompts/:id/action` or updating settings triggers `invalidateTrendingCache()`, clearing the cache immediately.
3. **Database-Level SQL Aggregation**:
   - Time-based trending queries use Prisma `groupBy` directly over the indexed `PromptActivity` table:
     ```typescript
     const activities = await prisma.promptActivity.groupBy({
       by: ['promptId', 'type'],
       where: {
         createdAt: { gte: startDate },
         prompt: ELIGIBLE_PROMPT_WHERE,
       },
       _count: { _all: true },
     });
     ```
   - Avoids hydrating thousands of activity rows into application memory.
4. **Database Composite Indexes**:
   - `[promptId, type, createdAt]`
   - `[type, createdAt]`
   - `[createdAt]`

---

## 8. Strict Content Eligibility Filters

Prompts must pass strict content checks to appear in any trending ranking. Any prompt matching one of the following criteria is automatically excluded:

$$\text{Eligible} = (\text{isDeleted} = \text{false}) \land (\text{status} = \text{true}) \land (\text{category.status} = \text{true}) \land (\text{subcategory.status} \neq \text{false})$$

- ❌ Soft-deleted prompts (`isDeleted: true`)
- ❌ Inactive or draft prompts (`status: false`)
- ❌ Prompts under a disabled Category (`category.status: false`)
- ❌ Prompts under a disabled Subcategory (`subcategory.status: false`)

---

## 9. Client Integration Examples

### 9.1 cURL

#### Fetch All Trending Prompts:
```bash
curl -X GET "https://your-domain.com/api/v1/trending?limit=10" \
  -H "x-api-key: YOUR_CLIENT_API_KEY" \
  -H "x-device-id: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
```

#### Fetch Today's Trending Only:
```bash
curl -X GET "https://your-domain.com/api/v1/trending?period=today&limit=5" \
  -H "x-api-key: YOUR_CLIENT_API_KEY"
```

#### Record a Prompt Copy Action:
```bash
curl -X POST "https://your-domain.com/api/v1/prompts/full-stack-nextjs/action" \
  -H "x-api-key: YOUR_CLIENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "copy",
    "deviceId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }'
```

---

### 9.2 JavaScript / TypeScript (Fetch API)

```typescript
const API_BASE = 'https://your-domain.com/api/v1';
const API_KEY = 'YOUR_CLIENT_API_KEY';

interface TrendingResponse {
  success: boolean;
  data: {
    today: RankedPrompt[];
    weekly: RankedPrompt[];
    monthly: RankedPrompt[];
    all_time: RankedPrompt[];
  };
}

// 1. Fetch All 4 Categories
async function fetchTrendingPrompts(deviceId: string, limit = 10): Promise<TrendingResponse> {
  const res = await fetch(`${API_BASE}/trending?limit=${limit}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
      'x-device-id': deviceId,
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// 2. Register a Like / Toggle
async function togglePromptLike(promptId: string, deviceId: string, userId?: string) {
  const res = await fetch(`${API_BASE}/prompts/${promptId}/action`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'like',
      toggle: true,
      deviceId,
      userId,
    }),
  });

  return res.json();
}
```

---

### 9.3 Android (Kotlin + Retrofit / OkHttp)

```kotlin
// 1. API Interface
interface PrompterApi {
    @GET("api/v1/trending")
    suspend fun getTrending(
        @Header("x-api-key") apiKey: String,
        @Header("x-device-id") deviceId: String,
        @Query("period") period: String? = null,
        @Query("limit") limit: Int = 10
    ): Response<TrendingApiResponse>

    @POST("api/v1/prompts/{id}/action")
    suspend fun registerAction(
        @Header("x-api-key") apiKey: String,
        @Path("id") promptId: String,
        @Body body: ActionRequest
    ): Response<ActionResponse>
}

// 2. Data Models
data class ActionRequest(
    val type: String, // "view", "like", "copy", "share"
    val deviceId: String,
    val userId: String? = null,
    val toggle: Boolean = false
)

data class TrendingApiResponse(
    val success: Boolean,
    val data: TrendingDataGroup
)

data class TrendingDataGroup(
    val today: List<RankedPrompt>,
    val weekly: List<RankedPrompt>,
    val monthly: List<RankedPrompt>,
    @SerializedName("all_time") val allTime: List<RankedPrompt>
)
```

---

### 9.4 iOS (Swift + URLSession)

```swift
import Foundation

struct TrendingService {
    let baseURL = URL(string: "https://your-domain.com/api/v1")!
    let apiKey = "YOUR_CLIENT_API_KEY"

    func fetchTrending(period: String? = nil, limit: Int = 10, deviceId: String) async throws -> [String: Any] {
        var components = URLComponents(url: baseURL.appendingPathComponent("trending"), resolvingAgainstBaseURL: true)!
        var queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]
        if let period = period {
            queryItems.append(URLQueryItem(name: "period", value: period))
        }
        components.queryItems = queryItems

        var request = URLRequest(url: components.url!)
        request.httpMethod = "GET"
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue(deviceId, forHTTPHeaderField: "x-device-id")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
    }

    func recordAction(promptId: String, actionType: String, deviceId: String) async throws {
        let url = baseURL.appendingPathComponent("prompts/\(promptId)/action")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "type": actionType,
            "deviceId": deviceId
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        _ = try await URLSession.shared.data(for: request)
    }
}
```

---

## 10. Error Handling & Status Codes

| HTTP Status | Error Code / Message | Reason & Solution |
|---|---|---|
| `200 OK` | `success: true` | Successful request. |
| `400 Bad Request` | `"Invalid action type"` | Action type was not `like`, `unlike`, `view`, `copy`, or `share`. |
| `401 Unauthorized` | `"Invalid or missing API key"` | Provide a valid key in the `x-api-key` header. |
| `404 Not Found` | `"Prompt not found"` | Prompt ID/slug does not exist, or is deleted/inactive. |
| `500 Internal Error` | `"Failed to retrieve trending prompts"` | Database connection issue. Check server logs. |

---

*Document version: 1.0.0 — Prompter Engine*
