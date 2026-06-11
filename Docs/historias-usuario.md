# Historias de Usuario y Criterios de Aceptación

Derivadas de [plan-ejecucion-master.md](plan-ejecucion-master.md), del diseño del MVP
([Design/README.md](Design/README.md)) y de los [ADRs](ADR/). Los criterios de
aceptación se escriben en formato Gherkin (Dado / Cuando / Entonces) para que sean
**verificables** y se conviertan directamente en tests (regla del DoD).

**Roles:** _padre/tutor_ (configura, único que escribe texto) · _niño/a_ (interactúa,
no-lector) · _evaluador_ (ejecuta y revisa el proyecto).

**Prioridad (MoSCoW):** Must = imprescindible para el HITO 1 (slice vertical) ·
Should = HITO 2 · Could = si hay margen.

## Trazabilidad (historia → fase → pantalla)

| ID    | Historia                         | Prioridad | Fase | Pantalla             |
| ----- | -------------------------------- | --------- | ---- | -------------------- |
| US-16 | Registro del adulto + consentim. | Must      | 1→4  | Alta / parental gate |
| US-01 | Crear perfil de niño             | Must      | 1→4  | Crear perfil         |
| US-17 | Logs y tracking de primera parte | Should    | 3→6  | —                    |
| US-02 | Listar y seleccionar perfiles    | Must      | 3→4  | Inicio / Generador   |
| US-03 | Generar cuento personalizado     | Must      | 2→4  | Generador            |
| US-04 | Fallback automático a mock       | Must      | 2    | Generador            |
| US-05 | Modo de IA configurable por env  | Must      | 2    | —                    |
| US-06 | Arranque reproducible            | Must      | 0    | —                    |
| US-07 | Guardar / marcar cuento          | Should    | 3→5  | Generador / Histor.  |
| US-08 | Ver historial de cuentos         | Should    | 5    | Historial            |
| US-09 | Ver actividades recomendadas     | Should    | 5    | Actividades          |
| US-10 | Registrar actividad completada   | Should    | 5    | Actividades/Histor.  |
| US-11 | Editar perfil                    | Should    | 5    | Configuración        |
| US-12 | Cambiar idioma (ES/EN)           | Should    | 5    | Configuración        |
| US-13 | Eliminar perfil                  | Should    | 5    | Configuración        |
| US-14 | Proveedor cloud opcional         | Could     | 5    | —                    |
| US-15 | Modo nocturno                    | Could     | 6    | Configuración        |

---

## Epic A — Perfil del niño y cuenta del adulto

### US-16 — Registro del adulto y consentimiento · Must

Como **padre/tutor** quiero registrarme (nombre, apellidos, parentesco, email) y dar mi
consentimiento para poder crear perfiles de mis hijos cumpliendo la ley.
Ver [cumplimiento-menores.md](cumplimiento-menores.md).

**Criterios de aceptación**

- Dado que no hay cuenta, Cuando abro la app, Entonces se me pide registrarme como
  adulto antes de poder crear un perfil de niño.
- Dado el alta, Cuando relleno nombre, apellidos, parentesco y email y acepto los
  términos, Entonces se crea el `Guardian` con el consentimiento registrado
  (`consentimientoDado`, `consentimientoEn`, versión).
- Dado que no acepto el consentimiento, Cuando intento continuar, Entonces no puedo
  crear perfiles de niños.
- Dado un parentesco, Cuando se guarda, Entonces es uno de
  `madre | padre | tutor_legal | abuelo_a | otro`.
- Dada la zona de gestión (configuración/perfiles), Cuando un niño la intenta abrir,
  Entonces queda tras una **puerta parental** (regla de tiendas Kids/Families).

### US-01 — Crear perfil de niño · Must

Como **padre/tutor** quiero crear el perfil de mi hijo/a (nombre, edad, avatar e
intereses) para que los cuentos y actividades se personalicen.

**Criterios de aceptación**

- Dado un `Guardian` con consentimiento (US-16), Cuando creo un perfil, Entonces el
  `ChildProfile` queda asociado a ese adulto (`guardianId`).
- Dado el formulario de perfil, Cuando relleno nombre, selecciono edad, avatar y al
  menos un interés y pulso "Guardar perfil", Entonces el perfil se persiste y queda
  disponible para generar cuentos.
- Dado que el nombre está vacío, Cuando intento guardar, Entonces se rechaza con un
  mensaje claro y no se crea el perfil.
- Dado un valor de edad fuera del rango permitido, Cuando se construye el perfil,
  Entonces el value-object `Edad` lanza error de dominio (no se crea el perfil).
- Dado un `idioma` no soportado, Cuando se construye el perfil, Entonces el
  value-object `Idioma` lo rechaza; si no se indica, el idioma por defecto es ES.
- (Dominio, Fase 1) Dado el caso de uso `CreateChildProfile`, Cuando recibe un DTO
  válido, Entonces devuelve el perfil creado sin tocar IO real (test con repositorio
  en memoria / mock).

### US-02 — Listar y seleccionar perfiles · Must

Como **padre/tutor** quiero ver los perfiles existentes y elegir uno para saber para
quién genero el cuento (soporte multi-niño).

**Criterios de aceptación**

- Dado que existen perfiles, Cuando abro "Ver perfiles" o el selector "¿Para quién es
  el cuento?", Entonces se listan todos los perfiles con su nombre y avatar.
- Dado que no existe ningún perfil, Cuando entro al generador, Entonces se me invita a
  crear uno antes de continuar.
- Dado que selecciono un perfil, Cuando genero un cuento, Entonces se usa ese perfil
  como destino.

---

## Epic B — Generación de cuentos (núcleo)

### US-03 — Generar cuento personalizado · Must

Como **niño/a** (con ayuda del tutor) quiero generar un cuento eligiendo tema y estilo
para escuchar una historia hecha para mí.

**Criterios de aceptación**

- Dado un perfil seleccionado, un tema (del vocabulario único
  `animales | espacio | magia | aventuras | música`, pre-seleccionado por los intereses
  del perfil) y un estilo (`aventura | divertido | educativo`), Cuando pulso "Generar
  cuento", Entonces se muestra un cuento con título y cuerpo en el idioma del perfil.
- Dado que la generación está en curso, Cuando espero, Entonces veo un estado de carga
  ("Invocando a las hadas escritoras…") y la UI no se bloquea.
- Dado el caso de uso de generación, Cuando se invoca, Entonces delega en la interfaz
  `AIProvider.generateStory({ perfil, tema, estilo })` y nunca depende de una
  implementación concreta (Clean Architecture, [ADR 0001](ADR/0001-arquitectura-limpia-monorepo.md)).
- (Mock, Fase 2) Dado `AI_PROVIDER=mock`, Cuando genero un cuento, Entonces recibo un
  resultado determinista y válido sin necesidad de Ollama.

### US-04 — Fallback automático a mock · Must

Como **evaluador** quiero que el sistema no se rompa si el LLM no responde para poder
ejecutar la demo sin GPU ni modelo descargado.

**Criterios de aceptación**

- Dado `AI_PROVIDER=local` y Ollama caído o sin responder en el timeout, Cuando se
  solicita un cuento, Entonces el sistema degrada automáticamente a `MockProvider` y
  devuelve un resultado válido.
- Dado el fallback, Cuando ocurre, Entonces se registra en logs (pino) sin exponer un
  error al usuario final.

### US-05 — Modo de IA configurable por entorno · Must

Como **desarrollador/evaluador** quiero seleccionar el modo de IA por variable de
entorno para alternar mock / local / cloud sin tocar código.

**Criterios de aceptación**

- Dado `AI_PROVIDER ∈ {mock, local, cloud}`, Cuando arranca el backend, Entonces se
  instancia el proveedor correspondiente.
- Dado un valor ausente o inválido, Cuando arranca, Entonces se usa `mock` por defecto.
- Dado `AI_PROVIDER=cloud` sin clave de API presente, Cuando arranca, Entonces no se
  activa cloud (se degrada/avisa según [ADR 0002](ADR/0002-tres-modos-de-ia.md)).

### US-07 — Guardar / marcar cuento · Should

Como **padre/tutor** quiero guardar un cuento generado para volver a leerlo después.

**Criterios de aceptación**

- Dado un cuento generado, Cuando lo marco (bookmark), Entonces se persiste asociado
  al perfil y aparece en el Historial con fecha y estado `nuevo`.
- Dado un cuento ya leído, Cuando lo abro de nuevo, Entonces su estado pasa a `leído`.

---

## Epic C — Actividades

### US-09 — Ver actividades recomendadas · Should

Como **niño/a** quiero ver actividades sugeridas para hoy para jugar y aprender.

**Criterios de aceptación**

- Dado un perfil, Cuando abro Actividades, Entonces veo actividades **generadas con
  IA** para ese perfil, cada una con categoría (`arte | música | lógica`), título,
  descripción y, si aplica, duración y nivel.
- (Dominio) Dado el caso de uso `RecommendActivities`, Cuando recibe un perfil,
  Entonces delega en `AIProvider.recommendActivities` y devuelve actividades coherentes
  con sus intereses/edad.
- Dado `AI_PROVIDER=mock` o IA caída, Cuando pido actividades, Entonces el fallback a
  mock devuelve un conjunto determinista válido (sin romper la pantalla).

### US-10 — Registrar actividad completada · Should

Como **padre/tutor** quiero registrar que mi hijo/a completó una actividad con una
valoración para llevar seguimiento del progreso.

**Criterios de aceptación**

- Dada una actividad, Cuando se marca como completada con una valoración (estrellas),
  Entonces el caso de uso `SaveProgress` la persiste con fecha.
- Dado un registro de progreso, Cuando consulto el Historial, Entonces aparece en
  "Actividades hechas" con su fecha y valoración.

---

## Epic D — Historial

### US-08 — Ver historial de cuentos · Should

Como **padre/tutor** quiero revisar los cuentos creados para releerlos.

**Criterios de aceptación**

- Dado el Historial, Cuando filtro por "Cuentos", Entonces veo los cuentos del perfil
  con título, fecha y estado (`nuevo | leído`) y la acción "Ver de nuevo".
- (Dominio) Dado el caso de uso `GetHistory`, Cuando recibe un perfil, Entonces
  devuelve cuentos y actividades ordenados por fecha descendente.

---

## Epic E — Configuración (zona de padres)

### US-11 — Editar perfil · Should

Como **padre/tutor** quiero editar los datos del perfil para mantenerlos al día.

**Criterios de aceptación**

- Dado un perfil existente, Cuando cambio nombre/edad/avatar/intereses y guardo,
  Entonces los cambios se persisten y se reflejan en las demás pantallas.

### US-12 — Cambiar idioma (ES/EN) · Should

Como **padre/tutor** quiero cambiar el idioma de la app y de los cuentos.

**Criterios de aceptación**

- Dado el idioma actual, Cuando lo cambio entre ES y EN, Entonces la UI y los nuevos
  cuentos se generan en el idioma elegido.
- Dado un cuento ya guardado, Cuando cambio el idioma, Entonces el cuento existente
  conserva su idioma original (no se re-traduce).

### US-13 — Eliminar perfil · Should

Como **padre/tutor** quiero eliminar un perfil y su progreso de forma controlada.

**Criterios de aceptación**

- Dado un perfil, Cuando pulso "Eliminar perfil", Entonces se pide confirmación
  explícita advirtiendo que la acción es permanente.
- Dado que confirmo, Cuando se ejecuta, Entonces se borran el perfil y sus
  cuentos/actividades asociados.

---

## Epic F — Plataforma y no-funcionales

### US-06 — Arranque reproducible · Must

Como **evaluador** quiero clonar y levantar todo con un comando para revisar el
proyecto sin pasos ocultos.

**Criterios de aceptación**

- Dado un equipo limpio, Cuando ejecuto `cp .env.example .env && docker compose up`,
  Entonces la pila (backend + PostgreSQL + Chroma + Ollama) levanta y `/health`
  responde 200.
- Dado el modo por defecto `AI_PROVIDER=mock`, Cuando arranco, Entonces todo funciona
  sin GPU ni modelo descargado.
- Dado que quiero IA local real, Cuando ejecuto `pnpm ollama:setup`, Entonces se
  descarga `gemma:2b` (único paso con red, documentado).

### US-17 — Logs y tracking de primera parte · Should

Como **responsable del producto** quiero registrar interacciones y acciones sensibles
de forma propia (sin terceros) para medir uso y tener trazabilidad cumpliendo las
reglas de menores. Ver [cumplimiento-menores.md](cumplimiento-menores.md).

**Criterios de aceptación**

- Dado un evento de uso (pantalla vista, cuento generado, actividad completada), Cuando
  ocurre, Entonces se registra un `InteractionEvent` con `profileId` (pseudónimo) y sin
  PII en el payload.
- Dado el tracking, Cuando se implementa, Entonces **no** usa SDKs de analítica/ads de
  terceros ni identificadores de dispositivo (regla Kids/Families).
- Dada una acción sensible del adulto (alta/edición/borrado de perfil, consentimiento),
  Cuando ocurre, Entonces se registra un `AuditLog` con actor, acción y entidad.
- Dada la política de conservación, Cuando se define, Entonces `InteractionEvent` y
  `AuditLog` se purgan según un plazo documentado (C-9).

### US-14 — Proveedor cloud opcional · Could

Como **desarrollador** quiero poder usar un proveedor cloud (Claude u OpenAI) si hay
clave para obtener mayor calidad de texto.

**Criterios de aceptación**

- Dado `AI_PROVIDER=cloud` con clave presente, Cuando genero un cuento, Entonces se
  usa el proveedor cloud configurado (un solo proveedor, [ADR 0002](ADR/0002-tres-modos-de-ia.md)).
- Dado que no hay clave, Cuando arranco en cloud, Entonces no se activa y se degrada a
  mock con aviso.

### US-15 — Modo nocturno · Could

Como **padre/tutor** quiero un modo nocturno para descansar la vista.

**Criterios de aceptación**

- Dado el ajuste de modo nocturno, Cuando lo activo, Entonces la app aplica el tema
  oscuro y persiste la preferencia.

---

## Inconsistencias detectadas y decisiones (resueltas 2026-06-10)

Hallazgos del cruce entre plan, diseño y ADRs. Todas resueltas y aplicadas a la
documentación; resumen en [memory.md](memory.md).

- **I-1 ✅ Casos de uso del núcleo ausentes.** Faltaban `GenerateStory` (el corazón) y
  `ListProfiles` (multi-niño). _Decisión:_ **añadidos** al plan, [ADR 0001](ADR/0001-arquitectura-limpia-monorepo.md)
  y phases.md.
- **I-2 ✅ Vocabulario intereses vs. tema.** _Decisión:_ **vocabulario único**
  `animales | espacio | magia | aventuras | música`, compartido por `intereses` y
  `tema`; los intereses **pre-seleccionan** el tema del cuento.
- **I-3 ✅ Actividades: ¿catálogo o generadas?** _Decisión:_ se **generan con IA** por
  perfil; `recommendActivities` las produce vía `AIProvider`. El catálogo del diseño es
  ilustrativo. Re-enfoca [ADR 0004](ADR/0004-base-de-datos-vectorial-chroma.md) (Chroma
  como memoria semántica de lo generado, condicional).
- **I-4 ✅ Idioma de los cuentos.** _Decisión:_ `generateStory` produce en `perfil.idioma`.
- **I-5 ✅ Rango de edad.** _Decisión:_ **2-6** (lo que ofrece la UI); el "2-5" del brand
  queda obsoleto.
- **I-6 ✅ Entidad de progreso/historial.** _Decisión:_ el progreso se modela como
  **estado** de `Story`/`Activity` (`completadaEn`, valoración, `nuevo|leído`), sin
  entidad `Progress` aparte (YAGNI).
- **I-7 ✅ Marca vs. paquete.** _Decisión:_ nombre visible **"Aprendizaje Mágico"**; el
  paquete sigue siendo `magyblob`.
