# Historias de Usuario y Criterios de Aceptación

Derivadas de [plan-ejecucion-master.md](../plan-ejecucion-master.md), del diseño del MVP
([Design/README.md](../Design/README.md)) y de los [ADRs](../ADR/). Los criterios de
aceptación se escriben en formato Gherkin (Dado / Cuando / Entonces) para que sean
**verificables** y se conviertan directamente en tests (regla del DoD).

**Roles:** _padre/tutor_ (configura, único que escribe texto) · _niño/a_ (interactúa,
no-lector) · _evaluador_ (ejecuta y revisa el proyecto).

**Prioridad (MoSCoW):** Must = imprescindible para el HITO 1 (slice vertical) ·
Should = HITO 2 · Could = si hay margen.

> **Mantenimiento (regla del DoD):** cada vez que se implementa o cambia una
> funcionalidad hay que actualizar la(s) historia(s) afectada(s) y esta tabla de
> trazabilidad (estado, fase, pantalla). Ver `CLAUDE.md`.

## Documentos por épica

| Épica | Documento                                           | Historias                                |
| ----- | --------------------------------------------------- | ---------------------------------------- |
| A     | [Perfil y cuenta del adulto](epic-a-perfil.md)      | US-16, US-19, US-20, US-21, US-01, US-02 |
| B     | [Generación de cuentos](epic-b-cuentos.md)          | US-03, US-04, US-05, US-07               |
| C     | [Actividades](epic-c-actividades.md)                | US-09, US-10                             |
| D     | [Historial](epic-d-historial.md)                    | US-08                                    |
| E     | [Configuración (zona de padres)](epic-e-config.md)  | US-11, US-12, US-13                      |
| F     | [Plataforma y no-funcionales](epic-f-plataforma.md) | US-06, US-17, US-18, US-14, US-15        |

## Trazabilidad (historia → fase → pantalla)

| ID    | Historia                            | Prioridad | Fase | Pantalla              | Épica                            |
| ----- | ----------------------------------- | --------- | ---- | --------------------- | -------------------------------- |
| US-16 | Registro del adulto + consentim.    | Must      | 1→4  | Alta / parental gate  | [A](epic-a-perfil.md#us-16)      |
| US-19 | Inicio de sesión del adulto         | Should    | 5    | Login / parental gate | [A](epic-a-perfil.md#us-19)      |
| US-20 | Editar cuenta del adulto            | Should    | 5    | Configuración         | [A](epic-a-perfil.md#us-20)      |
| US-21 | Eliminar cuenta + todos los datos   | Should    | 5    | Configuración         | [A](epic-a-perfil.md#us-21)      |
| US-01 | Crear perfil de niño                | Must      | 1→4  | Crear perfil          | [A](epic-a-perfil.md#us-01)      |
| US-17 | Logs y tracking de primera parte    | Should    | 3→6  | —                     | [F](epic-f-plataforma.md#us-17)  |
| US-18 | Configuración editable (prompts/IA) | Should    | 2→3  | —                     | [F](epic-f-plataforma.md#us-18)  |
| US-02 | Listar y seleccionar perfiles       | Must      | 3→4  | Inicio / Generador    | [A](epic-a-perfil.md#us-02)      |
| US-03 | Generar cuento personalizado        | Must      | 2→4  | Generador             | [B](epic-b-cuentos.md#us-03)     |
| US-04 | Fallback automático a mock          | Must      | 2    | Generador             | [B](epic-b-cuentos.md#us-04)     |
| US-05 | Modo de IA configurable por env     | Must      | 2    | —                     | [B](epic-b-cuentos.md#us-05)     |
| US-06 | Arranque reproducible               | Must      | 0    | —                     | [F](epic-f-plataforma.md#us-06)  |
| US-07 | Guardar / marcar cuento             | Should    | 3→5  | Generador / Histor.   | [B](epic-b-cuentos.md#us-07)     |
| US-08 | Ver historial de cuentos            | Should    | 5    | Historial             | [D](epic-d-historial.md#us-08)   |
| US-09 | Ver actividades recomendadas        | Should    | 5    | Actividades           | [C](epic-c-actividades.md#us-09) |
| US-10 | Registrar actividad completada      | Should    | 5    | Actividades/Histor.   | [C](epic-c-actividades.md#us-10) |
| US-11 | Editar perfil                       | Should    | 5    | Configuración         | [E](epic-e-config.md#us-11)      |
| US-12 | Cambiar idioma (ES/EN)              | Should    | 5    | Configuración         | [E](epic-e-config.md#us-12)      |
| US-13 | Eliminar perfil                     | Should    | 5    | Configuración         | [E](epic-e-config.md#us-13)      |
| US-14 | Proveedor cloud opcional            | Could     | 5    | —                     | [F](epic-f-plataforma.md#us-14)  |
| US-15 | Modo nocturno                       | Could     | 6    | Configuración         | [F](epic-f-plataforma.md#us-15)  |

## Inconsistencias detectadas y decisiones (resueltas 2026-06-10)

Hallazgos del cruce entre plan, diseño y ADRs. Todas resueltas y aplicadas a la
documentación; resumen en [memory.md](../memory.md).

- **I-1 ✅ Casos de uso del núcleo ausentes.** Faltaban `GenerateStory` (el corazón) y
  `ListProfiles` (multi-niño). _Decisión:_ **añadidos** al plan, [ADR 0001](../ADR/0001-arquitectura-limpia-monorepo.md)
  y phases.md.
- **I-2 ✅ Vocabulario intereses vs. tema.** _Decisión:_ **vocabulario único**
  `animales | espacio | magia | aventuras | música`, compartido por `intereses` y
  `tema`; los intereses **pre-seleccionan** el tema del cuento.
- **I-3 ✅ Actividades: ¿catálogo o generadas?** _Decisión:_ se **generan con IA** por
  perfil; `recommendActivities` las produce vía `AIProvider`. El catálogo del diseño es
  ilustrativo. Re-enfoca [ADR 0004](../ADR/0004-base-de-datos-vectorial-chroma.md) (Chroma
  como memoria semántica de lo generado, condicional).
- **I-4 ✅ Idioma de los cuentos.** _Decisión:_ `generateStory` produce en `perfil.idioma`.
- **I-5 ✅ Rango de edad.** _Decisión:_ **2-6** (lo que ofrece la UI); el "2-5" del brand
  queda obsoleto.
- **I-6 ✅ Entidad de progreso/historial.** _Decisión:_ el progreso se modela como
  **estado** de `Story`/`Activity` (`completadaEn`, valoración, `nuevo|leído`), sin
  entidad `Progress` aparte (YAGNI).
- **I-7 ✅ Marca vs. paquete.** _Decisión:_ nombre visible **"Aprendizaje Mágico"**; el
  paquete sigue siendo `magyblob`.
