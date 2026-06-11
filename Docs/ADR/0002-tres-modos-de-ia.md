# ADR 0002 — Capa de IA con tres modos tras una sola interfaz

- **Estado:** Aceptada
- **Fecha:** 2026-06-10
- **Relacionada con:** [ADR 0001](0001-arquitectura-limpia-monorepo.md),
  [ADR 0003](0003-gemma-2b-llm-local-por-defecto.md)

## Contexto

La generación de cuentos y la recomendación de actividades mediante IA son **el
núcleo del proyecto**. Esto impone tres tensiones simultáneas:

1. **Testabilidad y velocidad:** los tests y el desarrollo no pueden depender de un
   LLM real (lento, no determinista, requiere hardware).
2. **Evaluación sin GPU:** un evaluador debe poder ejecutar todo el sistema aunque
   no tenga GPU ni el modelo descargado.
3. **Flexibilidad:** poder usar un modelo local (privacidad, coste cero) o, si se
   desea, un proveedor en la nube de mayor calidad.

## Decisión

Definir **una única interfaz `AIProvider`** con las operaciones del dominio
(`generateStory({perfil, tema, estilo})` en el idioma del perfil, y
`recommendActivities`, que **genera** actividades según el perfil) y **tres
implementaciones intercambiables** seleccionadas por la variable de entorno
`AI_PROVIDER` (`mock | local | cloud`):

- **`MockProvider`** — se construye **primero**. Rápido, determinista, testeable sin
  Ollama. Cumple además dos funciones de seguridad: es el **fallback automático**
  cuando el proveedor activo no responde, y la red de seguridad para que un
  evaluador sin GPU corra todo en modo mock.
- **`OllamaProvider`** — ejecuta contra el modelo local por defecto, `gemma:2b` (ver
  [ADR 0003](0003-gemma-2b-llm-local-por-defecto.md)).
- **`CloudProvider`** — opcional, **uno solo** (Claude **u** OpenAI), activo únicamente
  si hay clave de API presente. Para la ruta cloud con Claude se usan los modelos
  Claude más recientes.

El valor por defecto es `mock`, de modo que clonar y arrancar funciona sin pasos
adicionales.

## Alternativas consideradas

- **Acoplar directamente a Ollama/Gemma.** Más simple a corto plazo, pero rompe la
  testabilidad, exige hardware para todo y deja al evaluador sin GPU fuera de juego.
- **Soportar varios proveedores cloud a la vez.** Más superficie y configuración sin
  beneficio para un TFM: basta con uno (YAGNI).
- **Mock solo en tests (no como proveedor de runtime).** Perderíamos el fallback
  automático y el modo de evaluación sin GPU, que son requisitos.

## Consecuencias

**Positivas**

- El dominio depende de una abstracción, no de un proveedor concreto (coherente con
  [ADR 0001](0001-arquitectura-limpia-monorepo.md)).
- Tests rápidos y deterministas contra `MockProvider`; smoke test manual del
  `OllamaProvider`.
- Robustez: si el LLM no responde, el sistema degrada a mock en vez de romper.
- Reproducibilidad: `docker compose up` con `AI_PROVIDER=mock` funciona en cualquier
  máquina.

**Costes / riesgos**

- Hay que mantener la paridad de contrato entre las tres implementaciones.
- El modo mock produce contenido fijo/plantillado; no representa la calidad real del
  LLM (se asume y se documenta).
