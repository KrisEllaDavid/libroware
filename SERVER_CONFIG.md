# Libroware — Server & Release Configuration

> **Current state:** App is accessible at `http://185.217.125.37:3030`  
> **Target domain:** `https://libroware.mathurinella.com` (follow sections 1–5 below to activate)

---

## Table of Contents

1. [DNS Setup](#1-dns-setup)
2. [System Nginx — Reverse Proxy](#2-system-nginx--reverse-proxy)
3. [SSL Certificate](#3-ssl-certificate-lets-encrypt)
4. [Production .env Update](#4-production-env-update)
5. [Switch API URL in Code](#5-switch-api-url-in-code)
6. [Docker Compose — Service Overview](#6-docker-compose--service-overview)
7. [GitHub Actions Secrets](#7-github-actions-secrets)
8. [Android Keystore Setup](#8-android-keystore-setup)
9. [Deployment Workflows](#9-deployment-workflows)
10. [Post-Deploy Prisma Migration](#10-post-deploy-prisma-migration)

---

## 1. DNS Setup

In your DNS manager (Contabo, Cloudflare, etc.) add an **A record**:

```
libroware.mathurinella.com  →  185.217.125.37
```

Allow up to 24 h for propagation. Verify with:
```bash
dig libroware.mathurinella.com +short
```

---

## 2. System Nginx — Reverse Proxy

> **Only needed once.** The VPS likely already runs Nginx for other services.  
> The Docker frontend container has its own internal Nginx that handles `/api/graphql → backend:5000`.  
> The system Nginx only needs to forward port 80/443 → Docker port 3030.

Create `/etc/nginx/sites-available/libroware`:

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name libroware.mathurinella.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS reverse proxy → Docker frontend container
server {
    listen 443 ssl http2;
    server_name libroware.mathurinella.com;

    ssl_certificate     /etc/letsencrypt/live/libroware.mathurinella.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/libroware.mathurinella.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    # All requests → Docker frontend (port 3030)
    # Internal Docker Nginx then routes /api/graphql → backend:5000
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

Enable and reload:
```bash
ln -s /etc/nginx/sites-available/libroware /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 3. SSL Certificate (Let's Encrypt)

> Run **after** DNS has propagated and Nginx is reloaded.

```bash
certbot --nginx -d libroware.mathurinella.com
```

Certbot will automatically edit the Nginx config and set up auto-renewal.  
Verify renewal works:
```bash
certbot renew --dry-run
```

---

## 4. Production .env Update

On the server, edit `~/libroware/.env` (or wherever your `.env` is stored).

Update `ALLOWED_ORIGINS` to include the domain **and** the native client origins
(Electron desktop uses `libroware://localhost`, Capacitor mobile uses `capacitor://localhost`):

```env
# Web + Electron + Mobile origins
ALLOWED_ORIGINS=https://libroware.mathurinella.com,http://185.217.125.37:3030,libroware://localhost,capacitor://localhost,https://localhost
```

> Keep `http://185.217.125.37:3030` in the list until the domain is fully live and confirmed working.  
> Remove it once you've switched over.

Then redeploy via GitHub Actions:
- **Contabo (Tailscale):** `libroware_deploy` → Run workflow
- **Public server:** `libroware_deploy_public` → Run workflow

---

## 5. Switch API URL in Code

> Do this **after** the domain is live and SSL is confirmed working.

In [`frontend/src/config/api.ts`](frontend/src/config/api.ts), change **one line**:

```ts
// Before (IP-based)
export const REMOTE_URL = "http://185.217.125.37:3030/api/graphql";

// After (domain-based)
export const REMOTE_URL = "https://libroware.mathurinella.com/api/graphql";
```

Then commit, push, and redeploy. All platforms (web, Electron, mobile) will pick up the new URL automatically.

---

## 6. Docker Compose — Service Overview

| Service | Container | External Port | Internal Port | Image |
|---------|-----------|---------------|---------------|-------|
| Frontend (Nginx + React) | `libroware-frontend` | `3030` | `80` | `node:20-slim` + `nginx:alpine` |
| Backend (Node.js GraphQL) | `libroware-backend` | `5000` | `5000` | `node:20-slim` |
| Database (PostgreSQL) | `libroware-postgres` | `5433` | `5432` | `postgres:16-alpine` |

**GraphQL endpoint (internal):** `backend:5000/graphql`  
**GraphQL endpoint (external via Nginx):** `http://185.217.125.37:3030/api/graphql` → `https://libroware.mathurinella.com/api/graphql` (after domain switch)

---

## 7. GitHub Actions Secrets

All secrets are set under: **GitHub repo → Settings → Secrets and variables → Actions**

### Deployment secrets (already configured)

| Secret | Purpose |
|--------|---------|
| `SSH_KEY` | Private SSH key for Contabo server (Tailscale) |
| `SERVER_HOST` | Tailscale IP of the Contabo server |
| `SERVER_USER` | SSH user on Contabo (`checkme-server`) |
| `ENV_FILE` | Full content of the server `.env` file |
| `PUBLIC_SSH_KEY` | Private SSH key for public server |
| `PUBLIC_SERVER_HOST` | IP of the public server |
| `PUBLIC_SERVER_USER` | SSH user on public server (`root`) |
| `PUBLIC_ENV_FILE` | Full content of the public server `.env` |
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID (tag: `tag:ci`) |
| `TS_OAUTH_CLIENT_SECRET` | Tailscale OAuth secret |

### Build secrets (needed for Android signed APK)

| Secret | Value |
|--------|-------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` keystore file (see section 8) |
| `ANDROID_KEY_ALIAS` | Key alias chosen during keytool generation |
| `ANDROID_KEY_PASSWORD` | Key password |
| `ANDROID_STORE_PASSWORD` | Keystore password |

---

## 8. Android Keystore Setup

> Run once. The `.jks` file signs every release APK. Keep it safe — losing it means you can't update the app.

### Step 1 — Generate the keystore

Run in PowerShell or terminal:
```powershell
keytool -genkey -v `
  -keystore libroware-release.jks `
  -alias libroware `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

Answer the prompts (name, organisation, country). When asked for passwords, note them — you'll need them in the next step.

### Step 2 — Base64-encode the keystore (PowerShell)

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("libroware-release.jks")) | clip
# The base64 string is now in your clipboard
```

### Step 3 — Add secrets to GitHub

Go to **GitHub repo → Settings → Secrets → Actions → New repository secret**:

| Secret name | Value |
|-------------|-------|
| `ANDROID_KEYSTORE_BASE64` | Paste from clipboard (Step 2) |
| `ANDROID_KEY_ALIAS` | `libroware` |
| `ANDROID_KEY_PASSWORD` | Password from Step 1 |
| `ANDROID_STORE_PASSWORD` | Keystore password from Step 1 |

### Step 4 — Configure Android signing in Gradle

After `npx cap add android`, edit `frontend/android/app/build.gradle` and add inside the `android {}` block:

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

## 9. Deployment Workflows

All workflows are **manual** (`workflow_dispatch`) — nothing runs automatically on push.

| Workflow | File | Purpose |
|----------|------|---------|
| Deploy to Contabo | `libroware_deploy.yml` | Deploys via Tailscale VPN to private server |
| Deploy to Public | `libroware_deploy_public.yml` | Deploys to public server (root user, `/root`) |
| Build Native Apps | `libroware_builds.yml` | Builds Windows .exe / Android APK / iOS IPA |

### Using `libroware_builds.yml`

Go to **GitHub → Actions → Build Native Apps → Run workflow**

Select which platforms to build:
- ☑ Windows — Electron NSIS installer (`.exe`)
- ☑ Android — Signed release APK
- ☐ iOS — Unsigned debug IPA (requires macOS runner, slower)

Artifacts are available under the completed workflow run for **30 days**.

---

## 10. Post-Deploy Prisma Migration

After any schema change is deployed, run the migration inside the backend container:

```bash
# SSH into the server first, then:
cd ~/libroware
docker-compose exec backend npx prisma migrate deploy
```

### Pending migrations (run after next deploy)

```bash
# Applies: soft deletes (User.deletedAt, Book.deletedAt) + AuditLog table
docker-compose exec backend npx prisma migrate deploy
```

> If running in development mode with `migrate dev` instead:
> ```bash
> docker-compose exec backend npx prisma migrate dev --name "soft_deletes_and_audit_log"
> ```
