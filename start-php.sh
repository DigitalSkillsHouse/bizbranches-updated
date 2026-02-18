#!/bin/sh
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "[start-php.sh] Project root: $ROOT"
echo "[start-php.sh] Starting PHP backend on 3002, frontend on $PORT..."

# Install PHP dependencies if needed
if [ ! -d "$ROOT/backend-php/vendor" ] && [ -f "$ROOT/backend-php/composer.json" ]; then
    echo "[start-php.sh] Installing PHP dependencies..."
    cd "$ROOT/backend-php"
    composer install --no-dev --optimize-autoloader 2>/dev/null || echo "[start-php.sh] Composer not found or failed - continuing without vendor packages"
fi

# Start PHP backend in background
cd "$ROOT/backend-php"
php -S 0.0.0.0:3002 index.php &
BACKEND_PID=$!
sleep 2

echo "[start-php.sh] PHP backend PID $BACKEND_PID running on port 3002"

# Start frontend (main process - Railway routes traffic here)
cd "$ROOT/frontend"
export HOSTNAME=0.0.0.0
export PORT="${PORT:-3000}"
export BACKEND_URL="http://localhost:3002"
export NEXT_PUBLIC_BACKEND_URL="http://localhost:3002"

echo "[start-php.sh] Launching Next.js on port $PORT..."
exec node ./node_modules/next/dist/bin/next start
