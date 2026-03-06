#!/bin/bash
# init-letsencrypt.sh
#
# Run ONCE on a new server to bootstrap Let's Encrypt certificates.
# After first run, the certbot service in docker-compose auto-renews every 12 hours.
#
# Usage:
#   export DOMAIN=yourdomain.com
#   export CERTBOT_EMAIL=admin@yourdomain.com
#   bash init-letsencrypt.sh
#
# Set CERTBOT_STAGING=1 to test against Let's Encrypt staging (no rate limits).

set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN before running. E.g.: DOMAIN=example.com bash init-letsencrypt.sh}"
EMAIL="${CERTBOT_EMAIL:-webmaster@${DOMAIN}}"
STAGING="${CERTBOT_STAGING:-0}"

CERTBOT_WWW="./certbot/www"
CERTBOT_CONF="./certbot/conf"

echo "==> Domain:  $DOMAIN"
echo "==> Email:   $EMAIL"
echo "==> Staging: $STAGING"

# 1. Create required directories
mkdir -p "$CERTBOT_WWW" "$CERTBOT_CONF/live/$DOMAIN"

# 2. Download recommended TLS parameters (certbot doesn't create these for --webroot)
if [ ! -f "$CERTBOT_CONF/options-ssl-nginx.conf" ]; then
    echo "==> Downloading TLS options..."
    curl -fsSL \
        https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
        -o "$CERTBOT_CONF/options-ssl-nginx.conf"
fi

if [ ! -f "$CERTBOT_CONF/ssl-dhparams.pem" ]; then
    echo "==> Downloading DH params..."
    curl -fsSL \
        https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
        -o "$CERTBOT_CONF/ssl-dhparams.pem"
fi

# 3. Create a temporary self-signed cert so nginx can start
#    (nginx fails to start if ssl_certificate paths don't exist)
echo "==> Creating temporary self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout "$CERTBOT_CONF/live/$DOMAIN/privkey.pem" \
    -out    "$CERTBOT_CONF/live/$DOMAIN/fullchain.pem" \
    -subj   "/CN=localhost" 2>/dev/null

# 4. Start nginx with the dummy cert
echo "==> Starting nginx..."
DOMAIN="$DOMAIN" docker compose up --force-recreate --no-deps -d nginx
echo "    Waiting for nginx to be ready on port 80..."
for i in $(seq 1 30); do
    if docker compose exec nginx nginx -t 2>/dev/null; then
        break
    fi
    sleep 1
done
sleep 2

# 5. Switch nginx to HTTP-only mode so it survives cert deletion.
#    This prevents nginx from crashing (and taking port 80 down) when
#    the self-signed cert is removed in the next step.
echo "==> Switching nginx to HTTP-only mode for ACME challenge..."
docker compose exec nginx sh -c "cat > /etc/nginx/conf.d/default.conf << 'NGINXCONF'
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }

    location / {
        return 200 'bootstrapping';
        add_header Content-Type text/plain;
    }
}
NGINXCONF
nginx -s reload"

# 6. Remove the temporary cert so certbot can write the real one
#    (nginx is now HTTP-only so it won't crash without the cert files)
echo "==> Removing temporary certificate..."
rm -rf \
    "$CERTBOT_CONF/live/$DOMAIN" \
    "$CERTBOT_CONF/archive/$DOMAIN" \
    "$CERTBOT_CONF/renewal/$DOMAIN.conf" 2>/dev/null || true

# 7. Request the real certificate via ACME HTTP-01 challenge (webroot)
staging_flag=""
[ "$STAGING" = "1" ] && staging_flag="--staging"

echo "==> Requesting Let's Encrypt certificate${staging_flag:+ (STAGING)}..."
DOMAIN="$DOMAIN" docker compose run --rm --entrypoint "" certbot \
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        ${staging_flag} \
        --email "$EMAIL" \
        --domains "$DOMAIN" --domains "www.$DOMAIN" \
        --rsa-key-size 4096 \
        --agree-tos \
        --force-renewal \
        --non-interactive

# 8. Restore the full nginx config and reload with the real certificate
echo "==> Restoring full nginx config and reloading..."
docker compose exec nginx sh -c \
    "envsubst '\${DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -s reload"

echo ""
echo "Done! Certificate issued for $DOMAIN."
echo "Auto-renewal runs every 12 hours via the certbot service."
echo ""
echo "Start the full stack:"
echo "  DOMAIN=$DOMAIN docker compose up -d"
