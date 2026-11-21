#!/usr/bin/env bash
# Usage: SSH_KEY=~/.ssh/key deploy/deploy.sh
# Builds the frontend once, then updates web servers one at a time so the LB always has a healthy node.
source "$(dirname "$0")/lib.sh"

echo "==> Building frontend"
(cd "$REPO_DIR/frontend" && npm ci --silent && npm run -s build)

wait_healthy() {
    local host="$1"
    for _ in $(seq 1 30); do
        if [[ "$(curl -s -o /dev/null -w '%{http_code}' "http://$host/api/health")" == 200 ]]; then
            return 0
        fi
        sleep 2
    done
    return 1
}

RSYNC_SSH="ssh ${SSH_OPTS[*]}"
for entry in "${WEB_HOSTS[@]}"; do
    name="${entry%%:*}" host="${entry#*:}"
    echo "==> Deploying to $name ($host)"
    rsync -az --delete -e "$RSYNC_SSH" \
        --exclude .venv --exclude .env --exclude tests --exclude '__pycache__' --exclude '.*_cache' \
        "$REPO_DIR/backend/" "$SSH_USER@$host:/opt/inkdoc/backend/"
    rsync -az --delete -e "$RSYNC_SSH" "$REPO_DIR/frontend/dist/" "$SSH_USER@$host:/opt/inkdoc/frontend/dist/"
    remote "$host" "/opt/inkdoc/backend/.venv/bin/pip install -q --upgrade pip && \
        /opt/inkdoc/backend/.venv/bin/pip install -q -r /opt/inkdoc/backend/requirements.txt && \
        sudo systemctl restart inkdoc"
    if ! wait_healthy "$host"; then
        echo "!! $name failed its health check; stopping before the next server." >&2
        exit 1
    fi
    echo "    $name healthy"
done
echo "Deployed. Live at http://$LB_HOST"
