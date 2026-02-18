# BizBranches - cPanel Single-Domain Deployment Guide

## Architecture (Single Domain)

```
bizbranches.pk/              → Next.js frontend (Node.js on cPanel)
bizbranches.pk/api/*         → PHP backend (Apache serves PHP natively)
bizbranches.pk/_next/static  → Static JS/CSS assets
bizbranches.pk/public files  → Images, manifest, robots.txt
```

Apache handles `/api/*` requests with PHP directly.
Everything else goes through the Node.js app (Next.js).
No subdomain needed -- everything runs on ONE domain.

### Directory on cPanel

```
public_html/
├── .htaccess          ← Routes /api/* to PHP, rest to Node.js
├── app.js             ← cPanel Node.js entry point
├── server.js          ← Next.js standalone server
├── .next/             ← Next.js build output
│   └── static/        ← CSS, JS bundles
├── public/            ← Images, fonts, manifest
├── api/               ← PHP backend (deployed here by CI/CD)
│   ├── .htaccess      ← PHP internal routing
│   ├── .env           ← Database credentials (create manually!)
│   ├── index.php      ← PHP API entry point
│   ├── config/
│   ├── lib/
│   ├── routes/
│   ├── migrations/
│   ├── scripts/       ← JSON data files for import
│   └── vendor/        ← Composer dependencies
└── tmp/
    └── restart.txt    ← Touch to restart Node.js
```

---

## Step 1: Initial cPanel Setup

### 1.1 Create MySQL Database

1. **cPanel > MySQL Databases**
2. Create database: `bizbranches` → becomes `digitalskills_bizbranchespk`
3. Create user: `bizuser` → becomes `digitalskills_bizuser`
4. Add user to database with **ALL PRIVILEGES**
5. **phpMyAdmin** → select database → **Import** tab → upload `backend-php/migrations/001_create_tables.sql`

### 1.2 Setup Node.js Application

1. **cPanel > Setup Node.js App**
2. Click **Create Application**:
   - Node.js version: **20.x** (or latest LTS)
   - Application mode: **Production**
   - Application root: `public_html`
   - Application URL: `bizbranches.pk`
   - Startup file: `app.js`
3. Click **Create**

### 1.3 Create `.env` File for PHP Backend

Via **File Manager**, create `public_html/api/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=digitalskills_bizbranchespk
DB_USER=digitalskills_bizuser
DB_PASS=your_database_password

APP_ENV=production
ADMIN_SECRET=pick_a_secret_word

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=mail.bizbranches.pk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@bizbranches.pk
SMTP_PASS=your_email_password
EMAIL_FROM=support@bizbranches.pk
EMAIL_FROM_NAME=BizBranches Support
SUPPORT_EMAIL=support@bizbranches.pk

SITE_URL=https://bizbranches.pk
FRONTEND_URL=https://bizbranches.pk
NEXT_PUBLIC_SITE_URL=https://bizbranches.pk
```

---

## Step 2: GitHub Secrets

Go to: **GitHub repo > Settings > Secrets and variables > Actions**

| Secret | Value |
|---|---|
| `FTP_SERVER` | `ftp.bizbranches.pk` |
| `FTP_USERNAME` | Your cPanel FTP username |
| `FTP_PASSWORD` | Your cPanel FTP password |
| `FTP_DEPLOY_DIR` | `/home/digitalskills/public_html/` |
| `SITE_URL` | `https://bizbranches.pk` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |

**Important**: `FTP_DEPLOY_DIR` must end with `/` and be the full server path to `public_html`.

---

## Step 3: Deploy

Push to `main` branch → GitHub Actions automatically:
1. Builds Next.js → uploads to `public_html/`
2. Installs Composer deps → uploads PHP to `public_html/api/`

Or trigger manually: **GitHub > Actions > Run workflow**

---

## Step 4: Import MongoDB Data

After the first deploy puts files on the server:

1. Visit: `https://bizbranches.pk/api/run-migration.php?secret=YOUR_ADMIN_SECRET`
2. Wait for it to finish (imports categories, cities, businesses, reviews, users)
3. **Delete** `run-migration.php` from the server via File Manager

---

## Step 5: Restart & Verify

1. **cPanel > Setup Node.js App** → Click **Restart**
2. Test frontend: `https://bizbranches.pk`
3. Test API: `https://bizbranches.pk/api/ping`
4. Test DB: `https://bizbranches.pk/api/db-health`

---

## SSL

1. **cPanel > SSL/TLS** or **Let's Encrypt**
2. Issue certificate for `bizbranches.pk`
3. Enable **Force HTTPS**

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `/api/*` returns 404 | Check `public_html/api/.htaccess` exists |
| API returns 500 | Check `public_html/api/.env` has correct DB credentials |
| Frontend blank page | Restart Node.js app in cPanel |
| CORS errors | `SITE_URL` in `api/.env` must match your domain |
| Static files not loading | Check `public_html/.next/static/` exists |
| Images not showing | Check `public_html/public/` folder was uploaded |
