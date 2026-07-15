# ADR 0002 — Capa de IA con dos modos tras una sola interfaz

- **Estado:** Aceptada
- **Fecha:** 2026-06-10
- **Actualización (2026-06-12):** se retira el tercer modo `cloud` del alcance. El proyecto
  se queda con `mock | local` (privacidad por diseño: los datos del menor no salen de la
  máquina). El resto de la decisión (interfaz única + fallback a mock) se mantiene.
- **Actualización (2026-06-12, reabre la anterior):** se **reintroduce** el modo `cloud`,
  pero como **opt-in apagado por defecto** y **conmutable en caliente desde la base de datos**
  (tabla `AppSetting`, clave JSON `ai.cloud` = `{activo, target, model}`). Los secretos
  (API keys) **siguen en variables de entorno**, nunca en BD. El defecto del proyecto sigue
  siendo `mock`/`local`; `cloud` solo se usa si un adulto lo activa explícitamente. Ver
  [US-14](../historias-usuario/epic-f-plataforma.md#us-14), el plan
  [14-proveedor-cloud](../planes/14-proveedor-cloud.md) y las salvedades de cumplimiento
  ([cumplimiento-menores.md](../cumplimiento-menores.md), C-5).
- **Actualización (2026-06-23, cambia el defecto):** por decisión del proyecto, el modo `cloud`
  pasa a estar **ACTIVO por defecto** (`ai.cloud.activo=true`, target `groq`), cargado al arrancar
  por una **migración de datos** (idempotente, no pisa cambios del adulto). Sigue siendo conmutable
  en caliente y, **sin la API key del target en env, cae automáticamente al modo base** (mock/local),
  por lo que un evaluador sin keys ejecuta en mock igual que antes. **Asume conscientemente** el
  coste de privacidad (C-5): con key presente, los datos minimizados del perfil salen a un tercero.
  Las keys siguen en env, nunca en BD.
- **Actualización (2026-07-07, US-99 — cascada de proveedores):** el modo `cloud` deja de tener un
  único `target` y pasa a una **cascada**. El defecto del proyecto es **Gemini → Groq → mock**:
  `ai.cloud.target = gemini` (`gemini-2.5-flash`) con `fallbacks: [groq (llama-3.3-70b-versatile)]`;
  `createAIProvider` construye la cadena en orden, **omitiendo cada paso sin API key en env** y
  **terminando siempre en mock**. Así, con la key de Gemini se usa Gemini; si falla o no está, Groq;
  y sin ninguna key, mock (el evaluador sigue ejecutando en mock). Configurable en caliente por BD
  (`ai.cloud`). Ver [US-99](../historias-usuario/epic-f-plataforma.md#us-99).
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
- **`CloudProvider`** _(opt-in, OFF por defecto — reintroducido el 2026-06-12)_ — adaptador
  único **compatible con OpenAI** (`/chat/completions`) que sirve a cualquier proveedor del
  mismo dialecto (Groq, Gemini, OpenRouter, Cerebras…) cambiando `baseUrl + model + apiKey`.
  Se **activa desde la BD** (clave `ai.cloud` de `AppSetting`, no por código); el `target`
  mapea en código a su `baseUrl` y a la variable de entorno con la API key. Cae a
  `MockProvider` ante fallo, igual que `local`.

El **modo base** por defecto es `mock` (`AI_PROVIDER`), de modo que clonar y arrancar funciona sin
pasos adicionales; `local` se selecciona por env (`AI_PROVIDER=local`). El modo `cloud` **no** se
enciende por env, sino por el AppSetting `ai.cloud` en BD. > **Nota (2026-06-23):** ese AppSetting
ahora se **siembra ACTIVO por defecto** (ver actualización arriba), así que el comportamiento por
defecto pasa a ser cloud **cuando hay key**; sin key, cae al modo base (mock/local). Las keys siguen
en env y la activación queda trazada ([AuditLog](../cumplimiento-menores.md)).

## Alternativas consideradas

- **Acoplar directamente a Ollama/Gemma.** Más simple a corto plazo, pero rompe la
  testabilidad, exige hardware para todo y deja al evaluador sin GPU fuera de juego.
- **Incluir un proveedor cloud (Claude/OpenAI).** Daría mejor calidad de texto, pero
  introduce coste, dependencia externa y, sobre todo, sacar datos del menor de la máquina.
  Se descartó el 2026-06-12 y se **reintrodujo el mismo día** como modo `cloud` **opt-in
  OFF por defecto**: la interfaz lo permitía sin tocar el dominio, y se acota con datos
  minimizados, activación explícita por BD y secretos en env (ver actualizaciones arriba).
- **Adaptador cloud por proveedor (uno para Groq, otro para Gemini…).** Descartado: casi
  todos los gratuitos exponen el dialecto OpenAI, así que un **único adaptador
  parametrizado** cubre todos (YAGNI). Cambiar de proveedor es cambiar datos, no código.
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
- El modo `cloud` **rompe la privacidad por diseño** (C-5): saca datos del perfil a un
  tercero. Se mitiga manteniéndolo OFF por defecto, enviando solo datos minimizados (sin
  nombre ni identificadores) y registrando su activación; el riesgo residual (incl. que los
  free tiers entrenen con los datos) se documenta en
  [cumplimiento-menores.md](../cumplimiento-menores.md).
