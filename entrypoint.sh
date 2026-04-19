#!/bin/sh

set -e

echo "🔍 Validating Environment"
deno run --allow-env --allow-read /app/validateEnv.ts

echo "🛠️ Installing Cron Job"

echo "$CRON_SCHEDULE deno run --allow-net --allow-sys --allow-env --allow-run --allow-read /app/main.ts" >/var/spool/cron/crontabs/root

echo "⏰ Starting Cron"
/usr/sbin/crond -f
