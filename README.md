# BizBranches

Full-stack business directory application with Next.js frontend and Express backend.

## Project Structure

```
combined-project/
├── frontend/     # Next.js 15 app (port 3000)
├── backend/      # Express API (port 3001)
└── package.json  # Root scripts to run both
```

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

Or manually:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment variables

Copy `.env.example` and configure:

- **Backend** (`backend/.env`): `MONGODB_URI`, `CLOUDINARY_*`, etc.
- **Frontend** (`frontend/.env.local`): `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`
- **AdSense success page** (optional): see [AdSense – Success page units](#adsense--success-page-units) below.

### 3. Run development

```bash
npm run dev
```

This starts:
- **Backend** at http://localhost:3001
- **Frontend** at http://localhost:3000

The frontend proxies `/api/*` requests to the backend automatically.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run frontend + backend in development |
| `npm run build` | Build both projects |
| `npm run start` | Run both in production mode |
| `npm run dev:frontend` | Frontend only |
| `npm run dev:backend` | Backend only |

## AdSense – Success page units

To use **separate ad units** on the "Listing submitted successfully" page (better revenue and reporting), create three units in the AdSense dashboard and set these in `frontend/.env.local`:

| Placement | Recommended type in AdSense | Env variable |
|-----------|-----------------------------|--------------|
| Above the fold | **Display → Responsive** | `NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_ABOVE_FOLD` |
| In-content (middle) | **Display → Responsive** or **In-article** | `NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_IN_CONTENT` |
| Footer | **Display → Responsive** | `NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_FOOTER` |

Use the **numeric slot ID** from each unit (e.g. `1234567890`). If a variable is unset, the default site ad unit is used. Responsive units work with the existing component; In-article for the middle slot can look more native.

## Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS, Radix UI
- **Backend**: Express, MongoDB, Cloudinary
