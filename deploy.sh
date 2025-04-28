#!/bin/bash

# Stop and remove existing containers
docker-compose down

# Pull latest changes if deploying from a repository
# git pull origin main

# Copy production environment file
cp .env.prod .env

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

