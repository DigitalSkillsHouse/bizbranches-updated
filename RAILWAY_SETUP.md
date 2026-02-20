# Railway Setup (One Service – Frontend + Backend)

Your project runs **one** Railway service. There is no separate "backend service."  
`start.sh` starts the **backend** (port 3002) and then the **frontend** (port from Railway) in the same container.

---

## 1. In Railway Dashboard

1. Open your **project** (e.g. BizBranches).
2. You should see **one service** (one box/card). Click it.
3. Go to **Settings** (or **Variables**).

---

## 2. Build & Start Commands

In the service **Settings**:

| Setting | Value |
|--------|--------|
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` or `sh start.sh` |
| **Root Directory** | *(leave empty – repo root)* |

If Railway auto-detected the start command, confirm it is `npm start` (which runs `start.sh`).

---

## 3. Variables (Environment)

In **Variables**, set these (at least):

| Variable | Required | Example / Note |
|----------|----------|-----------------|
| `MONGODB_URI` | **Yes** | `mongodb+srv://user:pass@cluster.mongodb.net/bizbranches` |
| `MONGODB_DB` | Optional | `bizbranches` |
| `PORT` | Set by Railway | Railway sets this; do not use 3001/3002 here |
| `NODE_ENV` | Optional | `production` |

**Email (confirmation after listing submit)** – add these so customers receive the “Your listing is live” email:

| Variable | Required | Example |
|----------|----------|---------|
| `SMTP_HOST` | Yes (for email) | `mail.bizbranches.pk` |
| `SMTP_PORT` | Optional | `465` |
| `SMTP_SECURE` | Optional | `true` |
| `SMTP_USER` | Yes (for email) | `support@bizbranches.pk` |
| `SMTP_PASS` | Yes (for email) | Your email account password |
| `EMAIL_FROM` | Optional | Same as SMTP_USER |
| `EMAIL_FROM_NAME` | Optional | `BizBranches Support` |
| `SITE_URL` | Optional | `https://bizbranches.pk` |

If these are not set, the listing still succeeds but no email is sent. **SMTP variables must be set in the same service that runs the backend** (in this one-service setup, add them in Railway Variables). On startup you should see `Email (SMTP): configured` in the logs; if you see `not configured`, the backend is not reading SMTP_HOST/SMTP_USER/SMTP_PASS (check variable names and that they are set in Railway, not only in frontend .env.local).

**If email still doesn’t arrive:** In Railway → your service → **Deployments** → **View Logs**, look for:
- `[Email] Sending confirmation to ...` → attempt was made.
- `[Email] Sent successfully for: ...` → server accepted the email (check spam; delivery is up to the mail server).
- `[Email] Failed for: ...` → see the error (e.g. "Invalid login", "Connection timeout"). If you see connection/timeout on port 465, try **SMTP_PORT=587** and **SMTP_SECURE=false** (STARTTLS). The code will use STARTTLS automatically when port is 587.

**Local development:** Confirmation email is sent by the **backend**. Put SMTP variables in **backend/.env** (copy from root `.env.example` or RAILWAY_SETUP table). Frontend `.env.local` is not read by the backend.

**Backend** runs on **3002 inside the container** (set in `start.sh`).  
**Frontend** runs on **PORT** (e.g. 3000) – Railway sends traffic to this port.

`BACKEND_URL` and `NEXT_PUBLIC_BACKEND_URL` are set **inside** `start.sh` to `http://localhost:3002`, so you do **not** need to add them in the Railway Variables tab for this one-service setup.

---

## 4. Check Logs (Why Form Might Fail)

1. In Railway → your service → **Deployments**.
2. Open the latest deployment → **View Logs** (or **Logs** tab).
3. Look for:
   - `[start.sh] Starting backend on 3002, frontend on ...` → script ran.
   - `Server running at http://0.0.0.0:3002` → backend started.
   - Any **red** lines or **MongoDB** / **connection** errors → backend may be crashing; fix `MONGODB_URI` (and network if needed).

If you **don’t** see "Server running at ... 3002", the backend never started. Fix the error shown in the logs (usually MongoDB or missing env).

---

## 5. Quick Checklist

- [ ] One service in the project (no separate "backend" service).
- [ ] Build command: `npm run build`.
- [ ] Start command: `npm start` or `sh start.sh`.
- [ ] `MONGODB_URI` set in Variables.
- [ ] Logs show backend "Server running at ... 3002" and no crash after it.

After that, the add-business form should be able to reach the backend at `http://localhost:3002` from inside the same container.
