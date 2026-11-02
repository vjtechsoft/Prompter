# Hostinger Deployment Guide: Prompter (Next.js 14 + MySQL)

This step-by-step guide covers how to deploy the **Prompter** Next.js application on **Hostinger Cloud / Business Web Hosting** using the built-in **Node.js Application Manager** and **Hostinger MySQL Databases**.

---

## Prerequisites
- A Hostinger Cloud or Business Web Hosting plan (includes Node.js support and SSH/Terminal access).
- Your domain or subdomain connected to Hostinger (with SSL enabled via Let's Encrypt in hPanel).
- Local database backup: [`prompter_backup.sql`](./prompter_backup.sql) (already prepared in project root).

---

## Step 1: Create MySQL Database on Hostinger

1. Log in to **Hostinger hPanel**.
2. Navigate to **Databases** → **MySQL Databases**.
3. Under **Create a New MySQL Database and User**:
   - **Database Name**: e.g., `prompter` (Hostinger will prefix it, e.g. `u123456789_prompter`).
   - **Username**: e.g., `admin` (e.g. `u123456789_admin`).
   - **Password**: Enter a secure password (save this).
4. Click **Create**.
5. Save your database credentials:
   - **Host**: `localhost` (or `127.0.0.1`)
   - **Port**: `3306`
   - **Database**: `u123456789_prompter`
   - **Username**: `u123456789_admin`
   - **Password**: `your_password`

---

## Step 2: Import Existing Database Data (phpMyAdmin)

1. In hPanel → **Databases** → **MySQL Databases**, locate your database in the list.
2. Click **Enter phpMyAdmin** next to it.
3. In phpMyAdmin, click the **Import** tab at the top.
4. Under **File to import**, click **Choose File** and select:
   `prompter_backup.sql`
5. Click **Go** (bottom right).
6. All 17 tables and existing records (admin accounts, categories, prompts, settings, deep-link configs) will be imported instantly.

---

## Step 3: Deploy Project Files to Hostinger

You can deploy the code using either **Git** or **File Manager/SSH**:

### Option A: Using Git (Recommended)
1. In hPanel, go to **Advanced** → **Git**.
2. Fill in:
   - **Repository**: `https://github.com/vjtechsoft/Prompter.git`
   - **Branch**: `main`
   - **Install directory**: `public_html` (or your subdomain folder)
3. Click **Create** / **Deploy**.

### Option B: Upload via SSH or File Manager
1. If using SSH / Terminal:
   ```bash
   cd ~/domains/yourdomain.com/public_html
   git clone https://github.com/vjtechsoft/Prompter.git .
   ```

---

## Step 4: Configure Environment Variables (`.env`)

In your project directory on Hostinger (`public_html`), create or edit `.env`:

```env
# Database connection
DATABASE_URL="mysql://u123456789_admin:YOUR_PASSWORD@localhost:3306/u123456789_prompter"

# Authentication secret
JWT_SECRET="your-super-strong-production-jwt-secret-key-2026"

# App Public URL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Node Environment
NODE_ENV="production"
PORT=3000
```

> [!TIP]
> Replace `u123456789_admin`, `YOUR_PASSWORD`, and `u123456789_prompter` with your actual Hostinger MySQL details from Step 1.

---

## Step 5: Setup Node.js Application in hPanel

1. In hPanel, go to **Advanced** → **Node.js** (or **Web Tools** → **Node.js**).
2. Click **Create Application** (or Edit if already created).
3. Configure:
   - **Node.js Version**: Select **20.x** (LTS).
   - **Application Mode**: **Production**.
   - **Application Root**: `public_html` (or your app directory).
   - **Application URL**: `yourdomain.com` (select your domain).
   - **Application Startup File**: `server.js` (standard Next.js production server provided in repository).
4. Click **Create** / **Save**.

---

## Step 6: Install Dependencies & Build Project

Open **SSH Access** (or hPanel Web Terminal under **Advanced** → **Terminal**):

```bash
# 1. Navigate to the app directory
cd ~/domains/yourdomain.com/public_html

# 2. Install dependencies
npm install

# 3. Generate Prisma client for Linux
npx prisma generate

# 4. Build the Next.js application
npm run build
```

---

## Step 7: Start / Restart the Application

1. In hPanel → **Node.js**, click **Restart Application**.
2. Open `https://yourdomain.com` in your browser.
3. Access your Admin Dashboard at `https://yourdomain.com/login`.

---

## Step 8: Setup Automatic Notification Scheduler (Cron Job)

To ensure scheduled push notifications trigger automatically on time:

1. In hPanel, go to **Advanced** → **Cron Jobs**.
2. Select **Custom**.
3. Set schedule to run every 1 minute: `* * * * *` (or every 5 minutes: `*/5 * * * *`).
4. Enter command:
   ```bash
   curl -s https://yourdomain.com/api/cron/notifications > /dev/null 2>&1
   ```
5. Click **Save**.

---

## Troubleshooting

- **500 Internal Server Error**: Check error logs in hPanel → **Node.js** or `stderr.log` inside `public_html`. Ensure `DATABASE_URL` is correct and can connect to `localhost:3306`.
- **Database Connection Refused**: Verify that the database user has been granted all privileges to the database in hPanel → **MySQL Databases**.
- **Memory Limit on Build**: If `npm run build` is killed due to memory limits, run `npm run build` on your local machine and upload the generated `.next/` folder to Hostinger.
