#!/bin/sh

if [ -z "$CRON_SCHEDULE" ]; then
    echo "❌ CRON_SCHEDULE is not set"
fi

echo "🛠️ Installing Cron Job"

echo "$CRON_SCHEDULE deno run --allow-net --allow-sys --allow-env --allow-run --allow-read /app/main.ts" >/var/spool/cron/crontabs/root

echo "⏰ Starting Cron"
/usr/sbin/crond -f
