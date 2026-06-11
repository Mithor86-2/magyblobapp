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

| ID    | Historia                        | Prioridad | Fase | Pantalla            |
| ----- | ------------------------------- | --------- | ---- | ------------------- |
| US-01 | Crear perfil de niño            | Must      | 1→4  | Crear perfil        |
| US-02 | Listar y seleccionar perfiles   | Must      | 3→4  | Inicio / Generador  |
| US-03 | Generar cuento personalizado    | Must      | 2→4  | Generador           |
| US-04 | Fallback automático a mock      | Must      | 2    | Generador           |
| US-05 | Modo de IA configurable por env | Must      | 2    | —                   |
| US-06 | Arranque reproducible           | Must      | 0    | —                   |
| US-07 | Guardar / marcar cuento         | Should    | 3→5  | Generador / Histor. |
| US-08 | Ver historial de cuentos        | Should    | 5    | Historial           |
| US-09 | Ver actividades recomendadas    | Should    | 5    | Actividades         |
| US-10 | Registrar actividad completada  | Should    | 5    | Actividades/Histor. |
| US-11 | Editar perfil                   | Should    | 5    | Configuración       |
| US-12 | Cambiar idioma (ES/EN)          | Should    | 5    | Configuración       |
| US-13 | Eliminar perfil                 | Should    | 5    | Configuración       |
| US-14 | Proveedor cloud opcional        | Could     | 5    | —                   |
| US-15 | Modo nocturno                   | Could     | 6    | Configuración       |

---

## Epic A — Perfil del niño

### US-01 — Crear perfil de niño · Must

Como **padre/tutor** quiero crear el perfil de mi hijo/a (nombre, edad, avatar e
intereses) para que los cuentos y actividades se personalicen.

**Criterios de aceptación**

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

- Dado un perfil seleccionado, un tema (`animales | espacio | magia`) y un estilo
  (`aventura | divertido | educativo`), Cuando pulso "Generar cuento", Entonces se
  muestra un cuento con título y cuerpo en el idioma del perfil.
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

- Dado un perfil, Cuando abro Actividades, Entonces veo una lista de actividades con
  categoría (`arte | música | lógica`), título, descripción y, si aplica, duración y
  nivel.
- Dada una actividad marcada como `próximamente`, Cuando se muestra, Entonces aparece
  deshabilitada con esa etiqueta.
- (Dominio) Dado el caso de uso `RecommendActivities`, Cuando recibe un perfil,
  Entonces devuelve actividades coherentes con sus intereses/edad (criterio de
  selección a definir; ver Inconsistencia I-3).

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

## Inconsistencias detectadas y decisiones pendientes

Hallazgos del cruce entre plan, diseño y ADRs. Cada uno propone un ajuste; los
marcados ⚠️ requieren decisión antes de cerrar el dominio (Fase 1).

- **I-1 ⚠️ Casos de uso del núcleo ausentes.** El plan/ADR 0001 nombran
  `CreateChildProfile`, `RecommendActivities`, `SaveProgress`, `GetHistory`, pero **no**
  `GenerateStory` (el corazón) ni `ListProfiles` (la UI multi-niño los exige).
  _Ajuste propuesto:_ añadir `GenerateStory` y `ListProfiles` a la lista de casos de uso.
- **I-2 ⚠️ Vocabulario intereses vs. tema.** `intereses` = {animales, aventuras,
  música, espacio}; `tema` de cuento = {animales, espacio, magia}. No coinciden.
  _Ajuste propuesto:_ decidir si los intereses del perfil pre-seleccionan el tema y
  unificar/mapear ambos vocabularios.
- **I-3 ⚠️ Actividades: ¿catálogo o generadas?** El diseño muestra un catálogo fijo
  (con "próximamente", niveles), pero `AIProvider.recommendActivities` sugiere IA.
  _Ajuste propuesto:_ definir actividades como **catálogo sembrado** y que
  `recommendActivities` **filtre/ordene** por perfil (no genere); Chroma solo si la
  similitud aporta ([ADR 0004](ADR/0004-base-de-datos-vectorial-chroma.md)).
- **I-4 Idioma de los cuentos.** No está documentado que el cuento se genere en el
  idioma del perfil. _Ajuste:_ fijar que `generateStory` produce en `perfil.idioma`.
- **I-5 Rango de edad 2-5 vs 2-6.** El brand de `DESIGN.md` dice 2-5; la pantalla y el
  VO `Edad` usan 2-6. _Ajuste:_ unificar (recomendado 2-6, que es lo que ofrece la UI).
- **I-6 Entidad de progreso/historial.** `SaveProgress`/`GetHistory` operan sobre datos
  de progreso, pero no hay entidad nombrada. _Ajuste:_ valorar una entidad `Progress`
  (o `HistoryEntry`) o modelar el progreso como estado de `Story`/`Activity`.
- **I-7 Marca vs. paquete.** Producto = "Aprendizaje Mágico"; repo/paquete = `magyblob`.
  No es contradicción, pero conviene fijar el nombre visible de la app.
