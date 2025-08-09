#!/usr/bin/env bash
set -euo pipefail

# --- Checks ---
command -v docker >/dev/null 2>&1 || { echo "Docker fehlt"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose (v2) fehlt"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl fehlt"; exit 1; }

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$ROOT_DIR/data"
WALLETS_JSON="$DATA_DIR/dormant_wallets.json"

if [ ! -f "$WALLETS_JSON" ]; then
  echo "FEHLT: $WALLETS_JSON — bitte deine dormant_wallets.json in $DATA_DIR ablegen."
  exit 2
fi

export COMPOSE_PROJECT_NAME=tresor_gui

echo "[1/3] Stoppe alten Stack …"
docker compose down -v || true

echo "[2/3] Baue Images …"
docker compose build --no-cache

echo "[3/3] Starte …"
docker compose up -d

# Healthcheck
echo -n "Warte auf Backend …"
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8080/health >/dev/null 2>&1; then
    echo " ok"
    echo "Fertig. Frontend: http://127.0.0.1:5173  | Backend: http://127.0.0.1:8080"
    exit 0
  fi
  sleep 0.5
  echo -n "."
done

echo
echo "WARNUNG: Backend-Health nicht erreichbar. Läuft evtl. hinter Proxy. Prüfe 'docker compose ps'."
exit 0
