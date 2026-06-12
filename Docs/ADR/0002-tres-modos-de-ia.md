# ADR 0002 — Capa de IA con dos modos tras una sola interfaz

- **Estado:** Aceptada
- **Fecha:** 2026-06-10
- **Actualización (2026-06-12):** se retira el tercer modo `cloud` del alcance. El proyecto
  se queda con `mock | local` (privacidad por diseño: los datos del menor no salen de la
  máquina). El resto de la decisión (interfaz única + fallback a mock) se mantiene.
- **Relacionada con:** [ADR 0001](0001-arquitectura-limpia-monorepo.md),
  [ADR 0003](0003-gemma-2b-llm-local-por-defecto.md)

## Contexto

La generación de cuentos y la recomendación de actividades mediante IA son **el
núcleo del proyecto**. Esto impone tres tensiones simultáneas:

1. **Testabilidad y velocidad:** los tests y el desarrollo no pueden depender de un
   LLM real (lento, no determinista, requiere hardware).
2. **Evaluación sin GPU:** un evaluador debe poder ejecutar todo el sistema aunque
   no tenga GPU ni el modelo descargado.
3. **Flexibilidad y privacidad:** poder usar un modelo local (privacidad, coste cero) sin
   acoplar el dominio a un proveedor concreto.

## Decisión

Definir **una única interfaz `AIProvider`** con las operaciones del dominio
(`generateStory({perfil, tema, estilo})` en el idioma del perfil, y
`recommendActivities`, que **genera** actividades según el perfil) y **dos
implementaciones intercambiables** seleccionadas por la variable de entorno
`AI_PROVIDER` (`mock | local`):

- **`MockProvider`** — se construye **primero**. Rápido, determinista, testeable sin
  Ollama. Cumple además dos funciones de seguridad: es el **fallback automático**
  cuando el proveedor activo no responde, y la red de seguridad para que un
  evaluador sin GPU corra todo en modo mock.
- **`OllamaProvider`** — ejecuta contra el modelo local por defecto, `gemma:2b` (ver
  [ADR 0003](0003-gemma-2b-llm-local-por-defecto.md)).

El valor por defecto es `mock`, de modo que clonar y arrancar funciona sin pasos
adicionales. La interfaz única deja la puerta abierta a añadir otros proveedores en el
futuro sin tocar el dominio, pero **ninguno se incluye en el alcance**.

## Alternativas consideradas

- **Acoplar directamente a Ollama/Gemma.** Más simple a corto plazo, pero rompe la
  testabilidad, exige hardware para todo y deja al evaluador sin GPU fuera de juego.
- **Incluir un proveedor cloud (Claude/OpenAI).** Daría mejor calidad de texto, pero
  introduce coste, dependencia externa y, sobre todo, sacar datos del menor de la máquina.
  Se **descartó** (privacidad por diseño + YAGNI); la interfaz permite añadirlo si algún día
  compensa.
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
