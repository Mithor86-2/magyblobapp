#!/usr/bin/env bash
# Descarga el modelo LLM por defecto (gemma:2b) dentro del contenedor de Ollama.
# Requiere que la pila esté levantada: `docker compose up -d ollama`.
set -euo pipefail

MODEL="${OLLAMA_MODEL:-gemma:2b}"

echo "→ Descargando modelo '${MODEL}' en el contenedor de Ollama..."
docker compose exec ollama ollama pull "${MODEL}"
echo "✓ Modelo '${MODEL}' listo."
