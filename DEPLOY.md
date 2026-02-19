# Deploy BizBranches

## 1. Build the frontend (static export)

From the project root:

```bash
cd frontend
npm install
npm run build
```

Output will be in **`frontend/out/`**. That folder is your deployable frontend.

## 2. Deploy the frontend

Upload the **contents** of `frontend/out/` to your web root (e.g. `public_html` or the folder that serves https://biz.digitalskillshouse.pk).

- **cPanel / Apache**: Upload `out/` contents. Ensure `.htaccess` is uploaded (it’s in `out/` from `public/.htaccess`) so listing URLs like `/digital-skills-house` load the app.
- **Netlify**: Set publish directory to `frontend/out` (or upload `out` and set publish to that folder). `_redirects` in `out/` will handle SPA routing.
- **Vercel**: Deploy the repo and set output directory to `frontend/out`, or use a static export preset if available.

## 3. Backend (API)

Your API is already at https://biz.digitalskillshouse.pk/api/ (PHP). Keep the backend deployed as it is so `/api/*` keeps working.

## 4. After deploy

- Visit https://biz.digitalskillshouse.pk/search
- Click a listing (e.g. Digital Skills House)
- You should land on the listing detail page (e.g. https://biz.digitalskillshouse.pk/digital-skills-house) with full details.

**If listing URLs show the homepage but the URL is correct:** The service worker was previously returning the cached homepage on failed requests. Deploy the updated `sw.js` (v3), then ask users to hard-refresh (Ctrl+Shift+R) or clear site data so the new worker installs.

**If listing URLs 404:** Confirm `.htaccess` (Apache) or `_redirects` (Netlify) is in the deployed folder so SPA fallback serves `index.html` for paths like `/digital-skills-house`.
