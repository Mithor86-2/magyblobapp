#!/usr/bin/env bash
# Levanta toda la pila en modo MOCK (IA determinista, sin GPU ni modelo).
# Uso: pnpm up:mock   (o  bash scripts/up-mock.sh)
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "→ Creando .env desde .env.example"; cp .env.example .env; }

echo "→ Levantando la pila en modo MOCK..."
AI_PROVIDER=mock docker compose up --build -d

echo "→ Esperando a que el backend responda en /health..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "✓ Backend arriba (modo mock): http://localhost:3000/health"
    exit 0
  fi
  sleep 1
done

echo "✖ El backend no respondió a tiempo. Revisa: docker compose logs backend" >&2
exit 1
