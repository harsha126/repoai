#!/bin/sh
set -e

# Wait for DB (very naive; you can improve with wait-for-it)
echo "Waiting for database..."
sleep 5

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting API server..."
node dist/index.js
