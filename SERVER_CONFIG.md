# Server Configuration for libroware.mathurinella.com

## 1. DNS

Add an **A record** in your DNS manager:
```
libroware.mathurinella.com  →  185.217.125.37
```

## 2. System Nginx (reverse proxy)

Create `/etc/nginx/sites-available/libroware`:

```nginx
server {
    listen 80;
    server_name libroware.mathurinella.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name libroware.mathurinella.com;

    ssl_certificate     /etc/letsencrypt/live/libroware.mathurinella.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/libroware.mathurinella.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # All traffic → Docker frontend container (port 3030)
    # The Docker Nginx inside then proxies /api/graphql → backend:5000
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
    }
}
```

Enable and reload:
```bash
ln -s /etc/nginx/sites-available/libroware /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 3. SSL Certificate (Let's Encrypt)

```bash
certbot --nginx -d libroware.mathurinella.com
```

## 4. Update production .env on the server

In `~/libroware/.env` (or wherever your .env lives), update ALLOWED_ORIGINS to include
the new domain AND the origins used by Electron/mobile clients:

```env
ALLOWED_ORIGINS=https://libroware.mathurinella.com,http://185.217.125.37:3030,libroware://localhost,capacitor://localhost,https://localhost
```

Then redeploy via GitHub Actions (workflow_dispatch on libroware_deploy or libroware_deploy_public).

## 5. Update apollo-client URL (after domain is live)

In `frontend/src/config/api.ts`, change:
```ts
export const REMOTE_URL = "http://185.217.125.37:3030/api/graphql";
```
to:
```ts
export const REMOTE_URL = "https://libroware.mathurinella.com/api/graphql";
```
Then commit, push, and redeploy.

---

## Android Keystore Setup (for signed APK builds)

### Generate keystore (run once on your machine):
```bash
keytool -genkey -v \
  -keystore libroware-release.jks \
  -alias libroware \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
Follow the prompts. Remember the passwords you set.

### Add to GitHub repository secrets:
Go to your repo → Settings → Secrets → Actions → New repository secret

| Secret name                | Value                                              |
|----------------------------|----------------------------------------------------|
| `ANDROID_KEYSTORE_BASE64`  | `base64 -w 0 libroware-release.jks` (Linux/Mac)   |
|                            | `certutil -encode libroware-release.jks tmp && findstr /v CERTIFICATE tmp` (Windows) |
| `ANDROID_KEY_ALIAS`        | `libroware` (or whatever alias you chose)          |
| `ANDROID_KEY_PASSWORD`     | The key password you entered                       |
| `ANDROID_STORE_PASSWORD`   | The keystore password you entered                  |

### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("libroware-release.jks")) | clip
# The base64 string is now in your clipboard — paste it as the secret value
```
