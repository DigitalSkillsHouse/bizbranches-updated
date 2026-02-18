# BizBranches - cPanel Deployment Guide (FTP + CI/CD)

## Architecture

```
bizbranches.pk (Main Domain)     --> Next.js Frontend (Node.js App on cPanel)
api.bizbranches.pk (Subdomain)   --> PHP Backend (Apache, runs natively)
MySQL Database                   --> cPanel phpMyAdmin
GitHub Actions                   --> Builds + deploys via FTP on every push to main
```

---

## Step 1: cPanel Setup

### 1.1 Create MySQL Database

1. Go to **cPanel > MySQL Databases**
2. Create a new database: `cpaneluser_bizbranches`
3. Create a new user: `cpaneluser_bizuser` with a strong password
4. Add user to the database with **ALL PRIVILEGES**
5. Go to **phpMyAdmin**, select the database, and import `backend-php/migrations/001_create_tables.sql`

### 1.2 Create API Subdomain

1. Go to **cPanel > Subdomains** (or **Domains**)
2. Create subdomain: `api.bizbranches.pk`
3. Set document root to: `/home/cpaneluser/api.bizbranches.pk`

### 1.3 Create Backend `.env` File

1. Go to **cPanel > File Manager**
2. Navigate to `/home/cpaneluser/api.bizbranches.pk/`
3. Create a file named `.env` with:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cpaneluser_bizbranches
DB_USER=cpaneluser_bizuser
DB_PASS=your_database_password

APP_ENV=production

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_SECRET=your_admin_secret

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

### 1.4 Setup Node.js Application (Frontend)

1. Go to **cPanel > Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 20.x (or latest LTS)
   - **Application mode**: Production
   - **Application root**: `bizbranches.pk` (or your domain's directory)
   - **Application URL**: `bizbranches.pk`
   - **Application startup file**: `app.js`
4. Click **Create**
5. Note the generated **virtual environment path** -- you'll need it if running commands via SSH

### 1.5 Create Frontend `.env.local`

Via File Manager or SSH, create `.env.local` in the frontend application root:

```env
NEXT_PUBLIC_BACKEND_URL=https://api.bizbranches.pk
BACKEND_URL=https://api.bizbranches.pk
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_SITE_URL=https://bizbranches.pk
NODE_ENV=production
```

---

## Step 2: GitHub Secrets Configuration

Go to your repo: **Settings > Secrets and variables > Actions > New repository secret**

Add these secrets:

| Secret Name | Example Value | Description |
|---|---|---|
| `FTP_SERVER` | `ftp.bizbranches.pk` | cPanel FTP hostname |
| `FTP_USERNAME` | `cpaneluser` | cPanel FTP username |
| `FTP_PASSWORD` | `your_ftp_password` | cPanel FTP password |
| `FTP_FRONTEND_DIR` | `/home/cpaneluser/bizbranches.pk/` | Path where frontend files go |
| `FTP_BACKEND_DIR` | `/home/cpaneluser/api.bizbranches.pk/` | Path where PHP files go |
| `BACKEND_URL` | `https://api.bizbranches.pk` | PHP API URL for frontend build |
| `SITE_URL` | `https://bizbranches.pk` | Main site URL |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary cloud name |

Optional (for database migrations via SSH):

| Secret Name | Example Value |
|---|---|
| `SSH_HOST` | `bizbranches.pk` |
| `SSH_USERNAME` | `cpaneluser` |
| `SSH_PASSWORD` | `your_ssh_password` |
| `DB_USER` | `cpaneluser_bizuser` |
| `DB_PASS` | `your_db_password` |
| `DB_NAME` | `cpaneluser_bizbranches` |

---

## Step 3: Deploy

### Automatic Deployment
Every push to the `main` branch triggers:
1. **Frontend job**: Installs deps, builds Next.js standalone, uploads via FTP
2. **Backend job**: Installs Composer deps, uploads PHP files via FTP

### Manual Trigger
Go to **GitHub > Actions > "Deploy to cPanel via FTP"** > Click **Run workflow**

### Database Migrations
Include `[migrate]` in your commit message to run SQL migrations:
```bash
git commit -m "Update schema [migrate]"
```

---

## Step 4: Post-Deployment

### Restart Node.js App
After the first FTP deployment of the frontend:
1. Go to **cPanel > Setup Node.js App**
2. Click **Restart** on your application

### Install npm Dependencies (First Time Only)
If the standalone build doesn't include all dependencies:
1. SSH into your server
2. Navigate to the app directory
3. Run: `npm install --production`

### Verify
- Frontend: Visit `https://bizbranches.pk`
- Backend API: Visit `https://api.bizbranches.pk/api/ping`
- Database: Check `https://api.bizbranches.pk/api/db-health`

---

## SSL Certificates

1. Go to **cPanel > SSL/TLS** or **Let's Encrypt**
2. Issue certificates for both:
   - `bizbranches.pk`
   - `api.bizbranches.pk`
3. Enable **Force HTTPS** in cPanel

---

## Troubleshooting

### Backend returns 500 errors
- Check `.env` file exists in the API subdomain root
- Verify database credentials in phpMyAdmin
- Check PHP error logs: **cPanel > Error Log**

### Frontend shows blank page
- Check Node.js app is running: **cPanel > Setup Node.js App**
- Verify `.env.local` has correct `BACKEND_URL`
- Check Node.js error logs in cPanel

### FTP deployment fails
- Verify FTP credentials in GitHub Secrets
- Check that `FTP_FRONTEND_DIR` and `FTP_BACKEND_DIR` paths end with `/`
- Ensure FTP user has write access to both directories

### CORS errors in browser
- The PHP backend allows origins listed in the `.env` file
- Make sure `FRONTEND_URL` and `NEXT_PUBLIC_SITE_URL` match your actual domain
