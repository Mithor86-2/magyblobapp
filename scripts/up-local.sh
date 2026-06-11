#!/usr/bin/env bash
# Levanta toda la pila en modo LOCAL (Ollama + gemma:2b), descargando el modelo
# si aún no está. Uso: pnpm up:local   (o  bash scripts/up-local.sh)
set -euo pipefail
cd "$(dirname "$0")/.."

MODEL="${OLLAMA_MODEL:-gemma:2b}"

[ -f .env ] || { echo "→ Creando .env desde .env.example"; cp .env.example .env; }

echo "→ Levantando la pila en modo LOCAL (Ollama + ${MODEL})..."
AI_PROVIDER=local docker compose up --build -d

echo "→ Esperando a que Ollama esté listo..."
for i in $(seq 1 60); do
  docker compose exec -T ollama ollama list >/dev/null 2>&1 && break
  sleep 1
done

if docker compose exec -T ollama ollama list 2>/dev/null | grep -qF "${MODEL}"; then
  echo "✓ Modelo ${MODEL} ya presente."
else
  echo "→ Descargando ${MODEL} (~1.7 GB, una sola vez)..."
  docker compose exec -T ollama ollama pull "${MODEL}"
fi

echo "→ Esperando a que el backend responda en /health..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "✓ Backend arriba (modo local): http://localhost:3000/health"
    echo "  La primera generación con ${MODEL} tarda ~15 s; las siguientes van más rápidas."
    exit 0
  fi
  sleep 1
done

echo "✖ El backend no respondió a tiempo. Revisa: docker compose logs backend" >&2
exit 1
