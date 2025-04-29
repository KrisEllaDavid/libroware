# Libroware Deployment Guide

This guide provides step-by-step instructions for deploying Libroware on an Amazon EC2 instance using Docker.

## Prerequisites

1. Amazon EC2 instance with:

   - At least 2GB RAM
   - 20GB storage
   - Ubuntu 22.04 or Amazon Linux 2

2. Install Docker and Docker Compose:

```bash
# Update packages
sudo apt-get update

# Install Docker dependencies
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Add Docker repository
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Update package database with Docker packages
sudo apt-get update

# Install Docker
sudo apt-get install -y docker-ce

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker ${USER}

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. Clone this repository:

```bash
git clone https://your-repository-url.git
cd libroware
```

## Configuration

1. Update the `.env.prod` file with your production credentials:

```bash
# Edit the .env.prod file
nano .env.prod
```

Make sure to update:

- `DB_PASSWORD` - Use a strong password
- `JWT_SECRET` - Use a strong, unique secret key
- Cloudinary credentials if needed

2. If you're using a domain name, update the `frontend/nginx.conf` file:

```bash
nano frontend/nginx.conf
```

Change `server_name localhost;` to `server_name yourdomain.com www.yourdomain.com;`

## Deployment

1. Make the deployment script executable:

```bash
chmod +x deploy.sh
```

2. Run the deployment script:

```bash
./deploy.sh
```

This will:

- Stop any existing containers
- Build and start all containers (PostgreSQL, backend, frontend)
- Apply database migrations
- Set up the application

3. After deployment, your application should be accessible at:
   - http://your-ec2-ip (if using the EC2 public IP)
   - http://your-domain.com (if you've configured a domain)

## Monitoring and Maintenance

### Checking container status:

```bash
docker-compose ps
```

### Viewing logs:

```bash
# All containers
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Restarting services:

```bash
docker-compose restart backend
```

### Stopping all services:

```bash
docker-compose down
```

### Backing up the database:

```bash
docker-compose exec postgres pg_dump -U postgres libroware_db > backup_$(date +%Y-%m-%d).sql
```

## Troubleshooting

If you encounter issues during deployment:

1. Check container logs for errors:

   ```bash
   docker-compose logs
   ```

2. Ensure the database is running:

   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```

3. Verify network connectivity between containers:

   ```bash
   docker-compose exec backend ping postgres
   ```

4. For database connection issues, check your DATABASE_URL in the backend environment.

## Security Notes

1. Update all default passwords in `.env.prod`
2. Consider setting up SSL with Let's Encrypt for production
3. Configure AWS security groups to only allow necessary ports (80, 443)
4. Set up regular database backups
