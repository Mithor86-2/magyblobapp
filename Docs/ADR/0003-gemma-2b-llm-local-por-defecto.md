# ADR 0003 — Gemma 2B como LLM local por defecto (vía Ollama)

- **Estado:** Aceptada
- **Fecha:** 2026-06-10
- **Relacionada con:** [ADR 0002](0002-tres-modos-de-ia.md)

## Contexto

El modo `local` de la capa de IA (ver [ADR 0002](0002-tres-modos-de-ia.md)) necesita
un modelo y un runtime concretos. El proyecto prioriza **privacidad** (datos de
perfiles de menores), **coste cero** y **reproducibilidad**: cualquiera debe poder
levantarlo sin claves ni facturación. A la vez, el hardware del evaluador es
incierto y un modelo grande haría el arranque inviable.

## Decisión

Usar **Ollama** como runtime de LLM local y **`gemma:2b`** como **modelo por
defecto**.

- Ollama corre como un servicio más en `docker compose` (puerto `11434`).
- El modelo se descarga con un paso documentado en el arranque:
  `ollama pull gemma:2b` (expuesto como `pnpm ollama:setup`).
- El modelo es configurable por entorno (`OLLAMA_MODEL`, por defecto `gemma:2b`),
  de modo que quien tenga más recursos pueda subir de tamaño sin cambiar código.

## Alternativas consideradas

- **Un modelo local mayor (7B+).** Mejor calidad de texto, pero descarga y consumo de
  memoria que muchos equipos de evaluación no soportan; choca con la reproducibilidad.
- **Solo nube (Claude/OpenAI).** Mejor calidad, pero introduce coste, dependencia de
  red y de claves, y compromete la privacidad de datos de menores. Queda como ruta
  **opcional** (`CloudProvider`), no por defecto.
- **Otros runtimes locales (llama.cpp directo, LM Studio).** Ollama ofrece una API
  HTTP simple, imágenes oficiales y `pull` de modelos integrado; encaja mejor con
  `docker compose`.

## Consecuencias

**Positivas**

- Coste cero y datos que no salen de la máquina.
- Arranque ligero: `gemma:2b` es pequeño y descargable en un paso documentado.
- Modelo intercambiable por variable de entorno sin tocar código.

**Costes / riesgos**

- `gemma:2b` es un modelo pequeño: la calidad/coherencia de los cuentos es limitada.
  Se asume como compromiso consciente (privacidad y reproducibilidad sobre calidad
  máxima) y se mitiga con el `MockProvider` para demos y tests, y la opción cloud para
  quien quiera más calidad.
- La primera descarga del modelo requiere conexión; es el único paso no
  autocontenido del arranque y por eso queda explícitamente documentado.
