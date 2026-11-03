#!/bin/sh

# Garage needs a one-time bootstrap: assign the single-node layout, import the S3 key
# used in the configs and create the bucket with permissions for that key. Every step
# is skipped when already done, so this can be rerun against a running stack.

set -eu

GARAGE_SERVICE="garage"
GARAGE_BUCKET="dsw"
GARAGE_KEY_ID="garageAccessKey"
GARAGE_KEY_SECRET="garageSecretKeyForDswE2ETests"

garage() {
  docker compose exec -T "$GARAGE_SERVICE" /garage "$@"
}

echo "Waiting for garage..."
attempts=0
until NODE_ID="$(garage node id -q 2>/dev/null)"; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 30 ]; then
    echo "garage is not running, check: docker compose logs $GARAGE_SERVICE" >&2
    exit 1
  fi
  echo "  still waiting for garage..."
  sleep 2
done
NODE_ID="${NODE_ID%%@*}"
echo "garage ready"

if garage status | grep -q "NO ROLE ASSIGNED"; then
  garage layout assign -z dc1 -c 1G "$NODE_ID"
  garage layout apply --version 1
fi

if ! garage key info "$GARAGE_KEY_ID" >/dev/null 2>&1; then
  garage key import "$GARAGE_KEY_ID" "$GARAGE_KEY_SECRET" -n dsw-key --yes
fi

if ! garage bucket info "$GARAGE_BUCKET" >/dev/null 2>&1; then
  garage bucket create "$GARAGE_BUCKET"
fi

garage bucket allow --read --write --owner "$GARAGE_BUCKET" --key "$GARAGE_KEY_ID"
