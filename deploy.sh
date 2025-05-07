#!/bin/bash

# Build and start containers
docker-compose up -d --build

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 20

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Create admin user if needed
# docker-compose exec backend npm run create-admin

echo "Deployment complete! Your application is now running." 

