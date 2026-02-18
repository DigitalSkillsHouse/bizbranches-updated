# Local Setup - Fix "Connection Failed"

## Step 1: Start the backend

Open a terminal and run:
```bash
npm run dev:backend
```

Wait until you see: `Server running at http://0.0.0.0:3001`

## Step 2: Test the backend

Open in browser: **http://localhost:3001/api/ping**

- **If you see** `{"ok":true,"message":"pong"}` → Backend is working! Go to Step 3.
- **If you see "Connection refused"** → Backend isn't running. Make sure Step 1 completed without errors.

## Step 3: Fix MongoDB (if cities/business data don't load)

If you see `querySrv ECONNREFUSED` in the backend terminal:

1. Go to **MongoDB Atlas** → **Network Access**
2. Click **Add IP Address**
3. Add **0.0.0.0/0** (Allow from anywhere) – or add your current IP
4. Save and wait 1–2 minutes

## Step 4: Start the full app

In a **new terminal**:
```bash
npm run dev
```

This runs both backend (3001) and frontend (3000).

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Ping test:** http://localhost:3001/api/ping
