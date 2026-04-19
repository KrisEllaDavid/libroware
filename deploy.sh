#!/bin/bash
set -e

# Build and start containers
docker-compose up -d --build

# Wait for backend to be healthy (up to 60s)
echo "Waiting for backend to be ready..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker-compose exec -T backend node -e "process.exit(0)" 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "Backend did not become ready in time. Aborting."
    docker-compose logs backend
    exit 1
  fi
  sleep 2
done
echo "Backend is ready."

# Apply pending database migrations
echo "Running database migrations..."
docker-compose exec -T backend npx prisma migrate deploy

echo "Deployment complete!"
