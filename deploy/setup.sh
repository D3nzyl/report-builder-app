#!/bin/bash
set -e

DOMAIN="reportbuilder.bydenzyl.com"
NGINX_CONF="/etc/nginx/sites-available/reportbuilder"

echo "==> Installing nginx and certbot..."
sudo apt update -y
sudo apt install -y nginx certbot python3-certbot-nginx

echo "==> Writing nginx config..."
sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    server_name reportbuilder.bydenzyl.com;

    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "==> Enabling site..."
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/reportbuilder

echo "==> Testing nginx config..."
sudo nginx -t

echo "==> Reloading nginx..."
sudo systemctl reload nginx

echo "==> Opening firewall ports..."
sudo ufw allow 'Nginx Full' || true

echo "==> Running certbot for HTTPS..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect -m chuadenzyl@gmail.com

echo "==> Testing cert auto-renewal..."
sudo certbot renew --dry-run

echo ""
echo "Done! Visit https://$DOMAIN"
