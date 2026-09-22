# ⚡ Prompter - Enterprise Prompt Management Admin Panel

A production-ready, full-stack **Prompt Management Admin Panel** built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **SQLite**.

---

## 🌟 Key Features & Capabilities

### 🔐 1. Strict Role-Based Access Control (RBAC)
- **Super Admin**:
  - **Strictly ONE** Super Admin account can exist in the system.
  - Full system access: Manage Prompts, Categories, Admins, Advertisements, Push Notifications, App Branding Settings, App URLs, and own profile.
  - Cannot create another Super Admin account.
  - Cannot be deleted by anyone.
- **Admin**:
  - **Maximum 4** Admin accounts permitted simultaneously.
  - Permissions: Dashboard analytics, Prompt CRUD, Category CRUD, and own Profile.
  - Restricted from: Managing Admin accounts, Ad settings, OneSignal broadcast configuration, App settings, and App URLs.

### 📊 2. Interactive Dashboard & Analytics
- **12 Metric Cards**:
  - Total Prompts, Total Categories, Premium Prompts, Published Prompts, Draft Prompts, Active Categories, Inactive Categories, Total Likes, Total Views, Total Shares, Total Admins, Trending Prompts.
- **Charts powered by Recharts**:
  - **Monthly Prompt Growth**: Bar Chart tracking volume over time.
  - **Category Distribution**: Donut/Pie Chart with interactive tooltips.
  - **Views & Likes Analytics**: Multi-line progression tracking views, likes, and shares.
- **Quick Lists**: Trending Prompts (with calculated viral scores) and Popular Categories with progress bars.

### 📝 3. Prompts Module
- **Rich CRUD Operations**:
  - Title, URL slug auto-generation (with manual override), formatted code/text prompt content, featured image, category selector, interactive multiple tag pills.
  - Engagement counters: Likes, Views, Shares.
  - Switches: **Premium (VIP / Free)** and **Status (Active / Draft)**.
- **Advanced Operations**:
  - **Duplicate Prompt**: Clones any prompt with `(Copy)` naming and unique slug.
  - **Soft Delete & Trash**: Prompts are soft-deleted into a trash view where they can be restored or permanently wiped.
  - **Bulk Actions**: Multi-select prompts to bulk activate, bulk draft, bulk set VIP, or bulk trash.
  - **Quick Preview Modal**: Instant pop-up previewing full prompt text with character counter and a 1-click **Copy Prompt** button.
  - **Exports**: Export filtered prompts to **CSV**, **Excel (.xlsx)**, and formatted **Print** sheets.
- **Custom Ranking Formulas**:
  - **Trending Score**: $\text{Views} \times 0.4 + \text{Likes} \times 0.4 + \text{Shares} \times 0.2$
  - **Popular Score**: $\text{Likes} + \text{Shares} + \text{Views}$

### 📁 4. Categories Module
- CRUD operations with image upload & preview.
- **Reordering**: Move Up / Move Down buttons and position arrangement.
- Auto prompt counter tracking how many active prompts are in each category.
- Safety safeguard: Blocks deleting categories that contain active prompts.

### ⚙️ 5. Settings Module (Super Admin Only)
- **Advertisement Management**:
  - Single active provider constraint enforced (**Google AdMob**, **Meta Audience Network**, or **Unity Ads**).
  - Configurable App IDs, Banner, Interstitial, Rewarded, Native, and App Open placement IDs.
- **Push Notifications (OneSignal Integration)**:
  - App ID, REST API Key, enable/disable toggle.
  - **Broadcast Composer**: Title, Message, Image URL, Deep Link, and immediate dispatch or scheduling.
  - Live broadcast history log.
- **App Settings**: App Name, Developer Organization, Package Name, Versioning, Support Email, Website, Contact, Timezone, Currency, and **Maintenance Mode** toggle.
- **App URLs**: Privacy Policy, Terms of Service, Refund Policy, Data Deletion Policy, and Social channels (Twitter/X, Telegram, YouTube, Instagram, Facebook).

### 🛡️ 6. Security & Audit Logging
- **JWT Authentication** stored in secure `HttpOnly` cookies + Bearer token header fallback.
- **Bcrypt password hashing** with 10 salt rounds.
- **Edge Middleware** guarding protected and role-restricted routes.
- **Secure File Upload**: Validates MIME types (JPG, PNG, WEBP) and 5MB size limit, generating cryptographically random filenames in `/public/uploads`.
- **Audit Logs**: Records `ActivityLog` entries for all CRUD operations, setting changes, and `LoginLog` records for successful and failed sign-in attempts.

### 🎨 7. UI/UX Design System
- Modern glassmorphism & material design aesthetics with Tailwind CSS.
- **Theme Provider**: Light, Dark, and System theme preferences persisted in `localStorage`.
- **Collapsible Sidebar**: Compact icon-only mode and full mode with responsive mobile drawer.
- **Global Search**: `⌘K` or `Ctrl+K` keyboard shortcut searching across prompts, categories, tags, and admins.
- Toast notifications, confirmation modals, and animated skeleton loaders.

### 📱 8. Client App Public REST APIs (`/api/v1`)
- Complete public REST APIs for consumer mobile apps (Flutter, React Native, Swift iOS, Kotlin Android) and web apps.
- Features: Non-repeating random pagination (`seed`), real-time engagement tracking (`like`, `view`, `share`), single-active ad SDK config (AdMob, Meta, Unity), maintenance mode gates, and mobile deep links (`prompter://...`).
- **Complete Developer Reference**: See [`CLIENT_API_DOCUMENTATION.md`](./CLIENT_API_DOCUMENTATION.md) for full request/response schemas and code samples in 5 languages.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### 2. Installation
```bash
# Clone or navigate to project directory
cd prompt-management-app

# Install dependencies
npm install
```

### 3. Database Setup & Seeding
The project uses SQLite via Prisma ORM for zero-configuration, instant local execution:

```bash
# Push database schema to SQLite
npx prisma db push

# Seed default Super Admin, sample Admins, Categories, Prompts, and Settings
npm run seed
```

### 4. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Seed Accounts

| Account Role | Email | Password |
|---|---|---|
| **Super Admin** (System Owner) | `admin@promptmanager.com` | `Admin@123456` |
| **Admin** (Sample Staff) | `sarah.jenkins@promptmanager.com` | `Admin@123456` |
| **Admin** (Sample Staff) | `marcus.reid@promptmanager.com` | `Admin@123456` |

> 💡 *Tip: The login screen contains one-click demo autofill buttons for testing.*

---

## 📁 Project Architecture

```
prompt-management-app/
├── prisma/
│   ├── dev.db              # SQLite Database file
│   ├── schema.prisma       # Prisma data models
│   └── seed.ts             # Seeding script
├── public/
│   └── uploads/            # Uploaded images
├── src/
│   ├── app/
│   │   ├── api/            # API Route Handlers (Auth, Prompts, Categories, Settings, Upload, etc.)
│   │   ├── dashboard/      # Analytics overview & charts
│   │   ├── prompts/        # Prompt list, table, trash, create & edit
│   │   ├── categories/     # Category CRUD & position reordering
│   │   ├── admins/         # Super Admin staff management
│   │   ├── settings/       # Ads, OneSignal, App Branding, URLs
│   │   ├── profile/        # Own profile, password & audit logs
│   │   ├── login/          # Split-screen login
│   │   ├── forgot-password/# Password recovery
│   │   └── reset-password/ # Password reset
│   ├── components/
│   │   ├── layout/         # Header, Sidebar, AdminLayout
│   │   ├── prompts/        # PromptForm component
│   │   ├── search/         # GlobalSearchModal (Ctrl+K)
│   │   ├── theme-provider  # Dark/Light/System theme provider
│   │   └── ui/             # Toast, Modal, Switch, Badge, Skeleton
│   ├── lib/
│   │   ├── auth.ts         # JWT & bcrypt authentication helpers
│   │   ├── audit.ts        # Activity & login logger
│   │   ├── prisma.ts       # Prisma client singleton
│   │   └── utils.ts        # Trending/Popular formulas, slugify, cn
│   ├── styles/
│   │   └── globals.css     # CSS variables & Tailwind directives
│   └── types/
│       └── index.ts        # TypeScript entity declarations
├── middleware.ts           # Next.js Edge route guard middleware
├── tailwind.config.ts      # Tailwind design tokens
└── tsconfig.json           # TypeScript configuration
```

---

## 📄 License
MIT © 2026 PromptForge Studio. All rights reserved.
