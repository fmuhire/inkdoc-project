# shellcheck shell=bash disable=SC2034,SC2029
# Shared settings for the deploy scripts; sourced, not executed.
set -euo pipefail

WEB_HOSTS=("web-01:35.175.138.189" "web-02:34.201.249.145")
LB_HOST="34.205.73.55"
SSH_USER="ubuntu"
: "${SSH_KEY:?Set SSH_KEY to the path of your SSH private key}"

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$DEPLOY_DIR")"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)

remote() {
    local host="$1"
    shift
    ssh "${SSH_OPTS[@]}" "$SSH_USER@$host" "$@"
}

upload() {
    scp -q "${SSH_OPTS[@]}" "$2" "$SSH_USER@$1:$3"
}
