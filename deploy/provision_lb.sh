#!/usr/bin/env bash
# Usage: SSH_KEY=... HAPROXY_STATS_USER=... HAPROXY_STATS_PASS=... deploy/provision_lb.sh
source "$(dirname "$0")/lib.sh"
: "${HAPROXY_STATS_USER:?Set HAPROXY_STATS_USER}" "${HAPROXY_STATS_PASS:?Set HAPROXY_STATS_PASS}"

rendered=$(mktemp)
trap 'rm -f "$rendered"' EXIT
sed -e "s|\${HAPROXY_STATS_USER}|$HAPROXY_STATS_USER|" \
    -e "s|\${HAPROXY_STATS_PASS}|$HAPROXY_STATS_PASS|" \
    "$DEPLOY_DIR/haproxy.cfg" >"$rendered"

echo "==> Provisioning lb-01 ($LB_HOST)"
upload "$LB_HOST" "$rendered" /tmp/inkdoc.haproxy
remote "$LB_HOST" "sudo bash -s" <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq haproxy curl >/dev/null
if [[ -f /etc/haproxy/haproxy.cfg ]]; then
    backup="/etc/haproxy/haproxy.cfg.bak-$(date +%Y%m%d%H%M%S)"
    cp /etc/haproxy/haproxy.cfg "$backup"
    echo "Previous config backed up to $backup"
fi
haproxy -c -q -f /tmp/inkdoc.haproxy
install -m 640 -o root -g haproxy /tmp/inkdoc.haproxy /etc/haproxy/haproxy.cfg
shred -u /tmp/inkdoc.haproxy
systemctl enable haproxy >/dev/null
systemctl reload-or-restart haproxy
echo "HAProxy running"
REMOTE
