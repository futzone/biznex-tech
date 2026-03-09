#!/bin/bash
# ==============================================
# Biznex Inventory — Ubuntu Server Deployment
# Domain: inventory.biznex.uz
# ==============================================
#
# USAGE:
#   1. Serverdagi kodingizni /var/www/biznex-tech ga joylashtiring
#   2. Bu scriptni root yoki sudo bilan ishga tushiring:
#      sudo bash deploy.sh
#
# TALABLAR:
#   - Ubuntu 20.04+ server
#   - inventory.biznex.uz DNS A record serverga yo'naltirilgan bo'lishi kerak
# ==============================================

set -e

APP_DIR="/var/www/biznex-tech"
APP_USER="www-data"
DOMAIN="inventory.biznex.uz"
PORT=3000

echo "=== 1. Sistem paketlarni yangilash ==="
apt update && apt upgrade -y

echo "=== 2. Node.js 20 LTS o'rnatish ==="
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

echo "=== 3. Nginx va Certbot o'rnatish ==="
apt install -y nginx certbot python3-certbot-nginx

echo "=== 4. Loyiha katalogini sozlash ==="
if [ ! -d "$APP_DIR" ]; then
  echo "XATO: $APP_DIR katalogi topilmadi!"
  echo "Avval loyihani serverga yuklang:"
  echo "  scp -r ./* user@server:$APP_DIR/"
  echo "  yoki git clone <repo-url> $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

echo "=== 5. .env faylni tekshirish ==="
if [ ! -f ".env" ]; then
  echo "XATO: .env fayl topilmadi!"
  echo "$APP_DIR/.env fayliga quyidagilarni yozing:"
  echo "  NEXT_PUBLIC_PB_URL=https://noco.biznex.uz/"
  exit 1
fi

echo "=== 6. Dependencylarni o'rnatish va build ==="
npm ci --production=false
npm run build

echo "=== 7. systemd service yaratish ==="
cat > /etc/systemd/system/biznex-tech.service << 'EOF'
[Unit]
Description=Biznex Inventory (Next.js)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/biznex-tech
ExecStart=/usr/bin/node node_modules/.bin/next start -p 3000
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/var/www/biznex-tech/.env

[Install]
WantedBy=multi-user.target
EOF

echo "=== 8. Fayl huquqlarini sozlash ==="
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

echo "=== 9. Serviceni ishga tushirish ==="
systemctl daemon-reload
systemctl enable biznex-tech
systemctl restart biznex-tech
echo "Service holati:"
systemctl status biznex-tech --no-pager || true

echo "=== 10. Nginx konfiguratsiya ==="
cat > /etc/nginx/sites-available/biznex-tech << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/biznex-tech /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "Nginx konfiguratsiyani tekshirish..."
nginx -t

systemctl restart nginx

echo "=== 11. SSL sertifikat (Let's Encrypt) ==="
echo "HTTPS uchun certbot ishga tushirilmoqda..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@biznex.uz --redirect

echo ""
echo "============================================"
echo "  TAYYOR!"
echo "  https://${DOMAIN} da ishlayapti"
echo "============================================"
echo ""
echo "Foydali buyruqlar:"
echo "  systemctl status biznex-tech   — holatni ko'rish"
echo "  systemctl restart biznex-tech  — qayta ishga tushirish"
echo "  journalctl -u biznex-tech -f   — loglarni ko'rish"
echo "  systemctl stop biznex-tech     — to'xtatish"
echo ""
