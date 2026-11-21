#!/usr/bin/env bash
# Usage: SSH_KEY=~/.ssh/key deploy/provision_web.sh path/to/backend.env
# Installs packages, the service user, systemd unit and nginx site on every web server.
source "$(dirname "$0")/lib.sh"

ENV_FILE="${1:?Pass the path to a backend .env file containing RAPIDAPI_KEY}"
[[ -f "$ENV_FILE" ]] || { echo "No such file: $ENV_FILE" >&2; exit 1; }

for entry in "${WEB_HOSTS[@]}"; do
    name="${entry%%:*}" host="${entry#*:}"
    echo "==> Provisioning $name ($host)"
    upload "$host" "$DEPLOY_DIR/nginx.conf" /tmp/inkdoc.nginx
    upload "$host" "$DEPLOY_DIR/inkdoc.service" /tmp/inkdoc.service
    upload "$host" "$ENV_FILE" /tmp/inkdoc.env
    remote "$host" "sudo bash -s" <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
stamp=$(date +%Y%m%d%H%M%S)

apt-get update -qq
apt-get install -y -qq nginx rsync curl >/dev/null
# A pinned standalone Python 3.12 via uv, since distro Pythons vary (Ubuntu 20.04 ships 3.8).
if [[ ! -x /usr/local/bin/uv ]]; then
    curl -fsSL "https://github.com/astral-sh/uv/releases/download/0.5.11/uv-$(uname -m)-unknown-linux-gnu.tar.gz" \
        | tar -xz -C /usr/local/bin --strip-components=1
fi
export UV_PYTHON_INSTALL_DIR=/opt/python
uv python install -q 3.12
python=$(uv python find 3.12)
echo "Using $($python --version)"

id inkdoc &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin inkdoc
install -d -o ubuntu -g ubuntu /opt/inkdoc /opt/inkdoc/backend /opt/inkdoc/frontend
[[ -x /opt/inkdoc/backend/.venv/bin/python ]] || sudo -u ubuntu "$python" -m venv /opt/inkdoc/backend/.venv

install -o inkdoc -g inkdoc -m 600 /tmp/inkdoc.env /opt/inkdoc/backend/.env
shred -u /tmp/inkdoc.env

install -m 644 /tmp/inkdoc.service /etc/systemd/system/inkdoc.service
systemctl daemon-reload
systemctl enable inkdoc >/dev/null 2>&1
systemctl try-restart inkdoc  # picks up a rotated key; no-op before the first deploy

tar -czf "/root/nginx-backup-$stamp.tgz" -C /etc nginx
install -m 644 /tmp/inkdoc.nginx /etc/nginx/sites-available/inkdoc
find /etc/nginx/sites-enabled -mindepth 1 ! -name inkdoc -delete
ln -sfn /etc/nginx/sites-available/inkdoc /etc/nginx/sites-enabled/inkdoc
nginx -t -q
systemctl enable --now nginx >/dev/null 2>&1
systemctl reload nginx
rm -f /tmp/inkdoc.nginx /tmp/inkdoc.service
echo "nginx config backed up to /root/nginx-backup-$stamp.tgz"
REMOTE
done
echo "Web servers provisioned. Run deploy/deploy.sh to ship the code."
