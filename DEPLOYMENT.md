# Libroware Deployment Guide

This guide covers deploying Libroware on a Contabo Ubuntu VPS using Docker.

## Prerequisites

1. Contabo VPS with:
   - At least 2GB RAM (4GB recommended)
   - 20GB+ SSD storage
   - Ubuntu 22.04 LTS

2. SSH access to the server as `ubuntu` user

## Tailscale Setup (one-time)

The deployment pipeline connects to the server over Tailscale — the server is not directly reachable from the internet.

### 1. Install Tailscale on the server

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Follow the auth link printed in the terminal to add the server to your Tailscale network.

### 2. Get the server's Tailscale IP

```bash
tailscale ip -4
```

This is the value you'll use for the `SERVER_HOST` GitHub secret (e.g. `100.x.x.x`).

### 3. Create a Tailscale OAuth client for GitHub Actions

1. Go to [tailscale.com/admin/settings/oauth](https://login.tailscale.com/admin/settings/oauth)
2. Create a new OAuth client with **Devices → Write** scope
3. Add an ACL tag in your Tailscale policy — under `tagOwners` add:
   ```json
   "tag:ci": ["autogroup:admin"]
   ```
4. Save the **Client ID** and **Client Secret** — these become `TS_OAUTH_CLIENT_ID` and `TS_OAUTH_CLIENT_SECRET` in GitHub secrets

### 4. Add GitHub Secrets

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|-------|
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID |
| `TS_OAUTH_CLIENT_SECRET` | Tailscale OAuth client secret |
| `SSH_KEY` | Private SSH key for the `ubuntu` user |
| `SERVER_HOST` | Tailscale IP of your Contabo server (e.g. `100.x.x.x`) |
| `ENV_FILE` | Full contents of your `.env` file |

---

## Server Setup (one-time)

### Install Docker

```bash
# Update packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce

# Enable Docker on boot
sudo systemctl enable docker
sudo systemctl start docker

# Allow ubuntu user to run Docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Configure Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3030/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> Do NOT expose port 5433 (Postgres) or 5000 (backend) publicly — they are only used internally via Docker's network.

## Configuration

### GitHub Actions Secrets

In your GitHub repository → Settings → Secrets and variables → Actions, set:

| Secret | Value |
|--------|-------|
| `SSH_KEY` | Private SSH key for the `ubuntu` user (ed25519 recommended) |
| `SERVER_HOST` | Contabo VPS public IP address |
| `ENV_FILE` | Full contents of your `.env` file (see below) |

### Environment File (`.env`)

```bash
DB_USER=postgres
DB_PASSWORD=your-strong-password-here
DB_NAME=libroware_db
NODE_ENV=production
JWT_SECRET=your-long-random-secret-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Copy the contents of this file into the `ENV_FILE` GitHub secret.

### Domain Name (optional)

If using a domain, update `frontend/nginx.conf`:

```bash
nano frontend/nginx.conf
```

Change `server_name localhost;` to `server_name yourdomain.com www.yourdomain.com;`

## Deployment

### Automated (GitHub Actions)

Push to the `main` branch — the workflow in `.github/workflows/libroware_deploy.yml` will:

1. SSH into the Contabo VPS
2. Clone the latest code
3. Write the `.env` file securely (mode 600)
4. Run `deploy.sh` to build and start all containers

### Manual

```bash
ssh ubuntu@<your-contabo-ip>
cd /home/ubuntu/libroware

# Write your .env file
nano .env

# Run deployment
chmod +x deploy.sh
./deploy.sh
```

The app will be available at `http://<your-contabo-ip>:3030`.

## Monitoring and Maintenance

```bash
# Container status
docker-compose ps

# Logs
docker-compose logs -f
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Restart a service
docker-compose restart backend

# Stop everything
docker-compose down
```

### Database backup

```bash
docker-compose exec postgres pg_dump -U postgres libroware_db > backup_$(date +%Y-%m-%d).sql
```

### Restore a backup

```bash
cat backup_2025-01-01.sql | docker-compose exec -T postgres psql -U postgres libroware_db
```

## SSL with Let's Encrypt

Install certbot and obtain a certificate:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl enable certbot.timer
```

## Troubleshooting

```bash
# Container logs
docker-compose logs

# Check Postgres is healthy
docker-compose exec postgres pg_isready -U postgres

# Check backend can reach Postgres
docker-compose exec backend ping postgres

# View running containers
docker ps

# Inspect a container
docker inspect libroware-backend
```

For database connection issues, verify `DATABASE_URL` matches the credentials in your `.env`.

## Security Notes

- Rotate `DB_PASSWORD` and `JWT_SECRET` regularly
- Never expose ports 5432 or 4000 in UFW — all traffic goes through nginx on port 80/443
- Keep Docker and Ubuntu packages up to date: `sudo apt-get update && sudo apt-get upgrade -y`
- Set up automated database backups (cron job or external service)
