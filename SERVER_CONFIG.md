# Libroware — Server & Release Configuration

> **Current state:** App is accessible at `http://185.217.125.37:3030`  
> **Domain:** Not configured yet — follow section 7 when you have one.

---

## Table of Contents

1. [Docker Compose — Service Overview](#1-docker-compose--service-overview)
2. [Production .env](#2-production-env)
3. [GitHub Actions Secrets](#3-github-actions-secrets)
4. [Deployment Workflows](#4-deployment-workflows)
5. [Android Keystore Setup](#5-android-keystore-setup)
6. [Post-Deploy Prisma Migration](#6-post-deploy-prisma-migration)
7. [When You Have a Domain](#7-when-you-have-a-domain)

---

## 1. Docker Compose — Service Overview

| Service | Container | External Port | Internal Port | Image |
|---------|-----------|---------------|---------------|-------|
| Frontend (Nginx + React) | `libroware-frontend` | `3030` | `80` | `node:20-slim` + `nginx:alpine` |
| Backend (Node.js GraphQL) | `libroware-backend` | `5000` | `5000` | `node:20-slim` |
| Database (PostgreSQL) | `libroware-postgres` | `5433` | `5432` | `postgres:16-alpine` |

**GraphQL endpoint (external):** `http://185.217.125.37:3030/api/graphql`  
**GraphQL endpoint (internal, Docker network):** `backend:5000/graphql`

---

## 2. Production .env

The `.env` file lives on the server at `~/libroware/.env`.  
It is written automatically by the GitHub Actions deploy workflow (from the `ENV_FILE` secret).

Minimum required fields:

```env
DATABASE_URL=postgresql://postgres:<password>@postgres:5432/libroware_db
JWT_SECRET=<strong-random-secret>
PORT=5000
NODE_ENV=production
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Web + Electron + Capacitor mobile origins
ALLOWED_ORIGINS=http://185.217.125.37:3030,libroware://localhost,capacitor://localhost,https://localhost
```

> When your domain is ready, add it to `ALLOWED_ORIGINS` and redeploy.

### Cookie security

The JWT is now stored in an `httpOnly; SameSite=Strict` cookie. To also add the `Secure` flag (required to prevent transmission over plain HTTP once you have TLS), add:

```env
COOKIE_SECURE=true
```

> Leave `COOKIE_SECURE=false` (the default) until HTTPS is active — the `Secure` flag would otherwise block the cookie entirely on HTTP connections.

### Optional: Email notifications (SMTP)

Add these to the `ENV_FILE` secret (or server `.env`) to enable due-date and overdue reminders:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=<smtp-password>
SMTP_FROM=Libroware <noreply@example.com>
# Optional — default is "0 8 * * *" (08:00 daily, server time)
# NOTIFICATION_CRON=0 8 * * *
```

> If `SMTP_HOST` is not set the notification scheduler still starts but all email sends are silently skipped — safe for dev/offline deployments.

---

## 3. GitHub Actions Secrets

Set under: **GitHub repo → Settings → Secrets and variables → Actions**

### Deployment secrets (already configured)

| Secret | Purpose |
|--------|---------|
| `SSH_KEY` | Private SSH key for Contabo server (Tailscale) |
| `SERVER_HOST` | Tailscale IP of the Contabo server |
| `SERVER_USER` | SSH user (`checkme-server`) |
| `ENV_FILE` | Full content of the server `.env` |
| `PUBLIC_SSH_KEY` | Private SSH key for the public server |
| `PUBLIC_SERVER_HOST` | IP of the public server |
| `PUBLIC_SERVER_USER` | SSH user (`root`) |
| `PUBLIC_ENV_FILE` | Full content of the public server `.env` |
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID (`tag:ci`) |
| `TS_OAUTH_CLIENT_SECRET` | Tailscale OAuth secret |

### Build secrets (needed for signed Android APK)

| Secret | Value |
|--------|-------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` file — see section 5 |
| `ANDROID_KEY_ALIAS` | Alias chosen during keytool generation |
| `ANDROID_KEY_PASSWORD` | Key password |
| `ANDROID_STORE_PASSWORD` | Keystore password |

---

## 4. Deployment Workflows

All workflows are **manual only** (`workflow_dispatch`) — nothing runs on push.

| Workflow | File | Purpose |
|----------|------|---------|
| Deploy to Contabo | `libroware_deploy.yml` | Tailscale VPN → private Contabo server |
| Deploy to Public | `libroware_deploy_public.yml` | Direct SSH → public server (`root`) |
| Build Native Apps | `libroware_builds.yml` | Windows .exe / Android APK / iOS IPA |

### Using the Build workflow

Go to **GitHub → Actions → Build Native Apps → Run workflow** and select:

- ☑ **Windows** — Electron NSIS installer (`.exe`)
- ☑ **Linux** — Electron installer (`.deb` / `.AppImage`)
- ☑ **Android** — Signed release APK
- ☐ **iOS** — Unsigned debug IPA (uses macOS runner, slower)

Artifacts are kept for **30 days** under the completed workflow run.

---

## 5. Android Keystore Setup

> Run once. The `.jks` file signs every release APK. Store it safely.

### Step 1 — Generate the keystore

```powershell
keytool -genkey -v `
  -keystore libroware-release.jks `
  -alias libroware `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

Note the passwords you set — you need them for the next steps.

### Step 2 — Base64-encode (PowerShell)

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("libroware-release.jks")) | clip
# The base64 string is now in your clipboard
```

### Step 3 — Add GitHub secrets

| Secret name | Value |
|-------------|-------|
| `ANDROID_KEYSTORE_BASE64` | Paste from clipboard |
| `ANDROID_KEY_ALIAS` | `libroware` |
| `ANDROID_KEY_PASSWORD` | Key password from Step 1 |
| `ANDROID_STORE_PASSWORD` | Keystore password from Step 1 |

### Step 4 — Configure Gradle signing

In `frontend/android/app/build.gradle`, add inside the `android {}` block:

```gradle
signingConfigs {
    release {
        storeFile     file(System.getenv('KEYSTORE_PATH') ?: 'libroware-release.jks')
        storePassword System.getenv('STORE_PASSWORD') ?: ''
        keyAlias      System.getenv('KEY_ALIAS') ?: ''
        keyPassword   System.getenv('KEY_PASSWORD') ?: ''
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

---

## 6. Post-Deploy Prisma Migration

After any schema change is deployed, run inside the backend container:

```bash
# SSH into server, then:
cd ~/libroware
docker-compose exec backend npx prisma migrate deploy
```

### Pending migration (run after next deploy)

```bash
# Applies: soft deletes (User.deletedAt, Book.deletedAt) + AuditLog table
docker-compose exec backend npx prisma migrate deploy
```

---

## 7. When You Have a Domain

Once you have a domain name, do the following in order:

### A. DNS
Point your domain to `185.217.125.37` with an A record.

### B. System Nginx on the server

Create `/etc/nginx/sites-available/libroware`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    location / {
        proxy_pass         http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        client_max_body_size 50m;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/libroware /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d yourdomain.com
```

### C. Update ALLOWED_ORIGINS in the server .env

```env
ALLOWED_ORIGINS=https://yourdomain.com,http://185.217.125.37:3030,libroware://localhost,capacitor://localhost,https://localhost
```

Update the `ENV_FILE` GitHub secret to match, then redeploy.

### D. Update the API URL in code

In `frontend/src/config/api.ts`, change **one line**:

```ts
// Change this one line when your domain is ready
export const REMOTE_URL = "https://yourdomain.com/api/graphql";
```

Commit, push, redeploy, and rebuild native apps.

