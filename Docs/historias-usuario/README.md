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

| Épica | Documento                                           | Historias                                                                                                                                                                                                                                    |
| ----- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | [Perfil y cuenta del adulto](epic-a-perfil.md)      | US-16, US-19, US-20, US-21, US-01, US-02, US-48, US-49                                                                                                                                                                                       |
| B     | [Generación de cuentos](epic-b-cuentos.md)          | US-03, US-04, US-05, US-07, US-22, US-26, US-28, US-47, US-54, US-55, US-59, US-61                                                                                                                                                           |
| C     | [Actividades](epic-c-actividades.md)                | US-09, US-10                                                                                                                                                                                                                                 |
| D     | [Historial](epic-d-historial.md)                    | US-08, US-27, US-62, US-63, US-64                                                                                                                                                                                                            |
| E     | [Configuración (zona de padres)](epic-e-config.md)  | US-11, US-12, US-13                                                                                                                                                                                                                          |
| F     | [Plataforma y no-funcionales](epic-f-plataforma.md) | US-06, US-17, US-18, US-14, US-15, US-23, US-24, US-25, US-29, US-30, US-31, US-32, US-33, US-34, US-35, US-36, US-37, US-38, US-39, US-40, US-41, US-42, US-43, US-44, US-45, US-46, US-50, US-51, US-52, US-53, US-56, US-57, US-58, US-60 |

## Trazabilidad (historia → fase → pantalla)

| ID    | Historia                               | Prioridad | Fase    | Pantalla                            | Épica                            |
| ----- | -------------------------------------- | --------- | ------- | ----------------------------------- | -------------------------------- |
| US-16 | Registro del adulto + consentim.       | Must      | 1→4     | Alta / parental gate                | [A](epic-a-perfil.md#us-16)      |
| US-19 | Inicio de sesión del adulto            | Should    | 5.5     | Login / parental gate               | [A](epic-a-perfil.md#us-19)      |
| US-20 | Editar cuenta del adulto               | Should    | 5       | Configuración                       | [A](epic-a-perfil.md#us-20)      |
| US-21 | Eliminar cuenta + todos los datos      | Should    | 5       | Configuración                       | [A](epic-a-perfil.md#us-21)      |
| US-01 | Crear perfil de niño                   | Must      | 1→4     | Crear perfil                        | [A](epic-a-perfil.md#us-01)      |
| US-17 | Logs y tracking de primera parte       | Should    | 3→6     | —                                   | [F](epic-f-plataforma.md#us-17)  |
| US-18 | Configuración editable (prompts/IA)    | Should    | 2→3     | —                                   | [F](epic-f-plataforma.md#us-18)  |
| US-02 | Listar y seleccionar perfiles          | Must      | 3→5.5   | Selección de perfil                 | [A](epic-a-perfil.md#us-02)      |
| US-49 | Selección de perfil al arrancar        | Should    | Mejoras | Selección de perfil                 | [A](epic-a-perfil.md#us-49)      |
| US-03 | Generar cuento personalizado           | Must      | 2→4     | Generador                           | [B](epic-b-cuentos.md#us-03)     |
| US-04 | Fallback automático a mock             | Must      | 2       | Generador                           | [B](epic-b-cuentos.md#us-04)     |
| US-05 | Modo de IA configurable por env        | Must      | 2       | —                                   | [B](epic-b-cuentos.md#us-05)     |
| US-06 | Arranque reproducible                  | Must      | 0       | —                                   | [F](epic-f-plataforma.md#us-06)  |
| US-07 | Guardar / marcar cuento                | Should    | 3→5     | Generador / Histor.                 | [B](epic-b-cuentos.md#us-07)     |
| US-08 | Ver historial de cuentos               | Should    | 5       | Historial                           | [D](epic-d-historial.md#us-08)   |
| US-09 | Ver actividades recomendadas           | Should    | 5       | Actividades                         | [C](epic-c-actividades.md#us-09) |
| US-10 | Registrar actividad completada         | Should    | 5       | Actividades/Histor.                 | [C](epic-c-actividades.md#us-10) |
| US-11 | Editar perfil                          | Should    | 5       | Configuración                       | [E](epic-e-config.md#us-11)      |
| US-12 | Cambiar idioma (ES/EN)                 | Should    | 5       | Configuración                       | [E](epic-e-config.md#us-12)      |
| US-13 | Eliminar perfil                        | Should    | 5       | Configuración                       | [E](epic-e-config.md#us-13)      |
| US-14 | Proveedor cloud opcional               | Could     | 14      | Config (zona padres)                | [F](epic-f-plataforma.md#us-14)  |
| US-15 | Modo nocturno                          | Could     | 6       | Configuración                       | [F](epic-f-plataforma.md#us-15)  |
| US-22 | Narrar cuento en voz alta              | Could     | Mejoras | Generador / Historial               | [B](epic-b-cuentos.md#us-22)     |
| US-23 | Avisos/confirmaciones (modal app)      | Should    | Mejoras | Toda la app                         | [F](epic-f-plataforma.md#us-23)  |
| US-24 | Navegación con cabecera y "atrás"      | Should    | Mejoras | Stack (onboarding/adultos)          | [F](epic-f-plataforma.md#us-24)  |
| US-25 | Autor (proveedor de IA) del contenido  | Should    | Mejoras | Generador/Actividades/Histor.       | [F](epic-f-plataforma.md#us-25)  |
| US-26 | Contenido más personalizado por niño   | Should    | Mejoras | — (prompts backend)                 | [B](epic-b-cuentos.md#us-26)     |
| US-27 | Releer un cuento desde el Historial    | Should    | Mejoras | Lectura de cuento                   | [D](epic-d-historial.md#us-27)   |
| US-28 | Reglas narrativas del cuento (prompt)  | Should    | Mejoras | — (prompts backend)                 | [B](epic-b-cuentos.md#us-28)     |
| US-29 | Iconografía consistente (lucide)       | Should    | Mejoras | Toda la app                         | [F](epic-f-plataforma.md#us-29)  |
| US-30 | Pruebas user-centric de componentes    | Should    | Mejoras | Componentes (app)                   | [F](epic-f-plataforma.md#us-30)  |
| US-31 | Análisis estático de calidad (SonarJS) | Should    | Mejoras | — (lint backend)                    | [F](epic-f-plataforma.md#us-31)  |
| US-32 | Integración con BD real, E2E y CI      | Should    | 6       | — (tests/CI)                        | [F](epic-f-plataforma.md#us-32)  |
| US-33 | Actualizar GitHub Actions (Node 24)    | Could     | Mantto. | — (CI)                              | [F](epic-f-plataforma.md#us-33)  |
| US-34 | Log de prompts de IA y configuración   | Should    | Mejoras | — (logs backend)                    | [F](epic-f-plataforma.md#us-34)  |
| US-35 | Cobertura estratégica (100/80/0)       | Should    | Mejoras | — (tests/CI)                        | [F](epic-f-plataforma.md#us-35)  |
| US-36 | Git hooks de calidad (Husky)           | Should    | Mejoras | — (tooling)                         | [F](epic-f-plataforma.md#us-36)  |
| US-37 | E2E web multinavegador (Playwright)    | Could     | Mejoras | — (tests/CI)                        | [F](epic-f-plataforma.md#us-37)  |
| US-38 | E2E nativo en simuladores (Maestro)    | Could     | Mejoras | — (tests/CI)                        | [F](epic-f-plataforma.md#us-38)  |
| US-39 | E2E de actividades e historial         | Could     | Mejoras | — (tests/CI)                        | [F](epic-f-plataforma.md#us-39)  |
| US-40 | Monitorización de errores (Sentry)     | Could     | Mejoras | — (app, runtime)                    | [F](epic-f-plataforma.md#us-40)  |
| US-41 | Degradación elegante (ErrorBoundary)   | Could     | 6       | Toda la app / pant. contenido       | [F](epic-f-plataforma.md#us-41)  |
| US-42 | Telemetría del recorrido (breadcrumbs) | Could     | 6       | — (app, runtime)                    | [F](epic-f-plataforma.md#us-42)  |
| US-43 | Robustez de red/IA: timeouts y errores | Should    | 6       | http.ts / CreateProfile / Historial | [F](epic-f-plataforma.md#us-43)  |
| US-44 | Validación de fronteras con Zod        | Should    | Mejoras | parseResponse / settings / http.ts  | [F](epic-f-plataforma.md#us-44)  |
| US-45 | Sesión autenticada del adulto con JWT  | Should    | 6       | Login / http.ts / rutas backend     | [F](epic-f-plataforma.md#us-45)  |
| US-46 | Configuración validada con Zod         | Should    | Mejoras | — (config backend)                  | [F](epic-f-plataforma.md#us-46)  |
| US-51 | Ambiente de producción guiado          | Should    | Mejoras | — (infra/despliegue)                | [F](epic-f-plataforma.md#us-51)  |
| US-47 | Cuentos mejorados (multi-tema/prompt)  | Should    | Mejoras | Generador                           | [B](epic-b-cuentos.md#us-47)     |
| US-48 | Contraseña en el alta y login real     | Should    | Mejoras | Alta / Login                        | [A](epic-a-perfil.md#us-48)      |
| US-50 | Dashboard/Home sin sesión (efímero)    | Should    | Mejoras | Inicio sin sesión                   | [F](epic-f-plataforma.md#us-50)  |
| US-52 | Icono de la app y splash de marca      | Could     | Mejoras | Launcher / Splash                   | [F](epic-f-plataforma.md#us-52)  |
| US-53 | Robustez prod + alta/login (red)       | Should    | Mejoras | Alta/Login + red                    | [F](epic-f-plataforma.md#us-53)  |
| US-54 | Contenido IA: títulos/instruc./temas   | Should    | Mejoras | Generador / Actividades             | [B](epic-b-cuentos.md#us-54)     |
| US-55 | Voz de la narración por idioma (ES/EN) | Could     | Mejoras | Narración                           | [B](epic-b-cuentos.md#us-55)     |
| US-56 | Estándares de diseño Android/iOS       | Should    | Mejoras | Toda la app                         | [F](epic-f-plataforma.md#us-56)  |
| US-57 | i18n del app (ES/EN)                   | Should    | Mejoras | Toda la app / Zona adultos          | [F](epic-f-plataforma.md#us-57)  |
| US-58 | Cabeceras por pantalla                 | Could     | Mejoras | Cabeceras                           | [F](epic-f-plataforma.md#us-58)  |
| US-59 | Portadas de imagen de cuentos/activ.   | Could     | Mejoras | Generador / Lectura / Actividades   | [B](epic-b-cuentos.md#us-59)     |
| US-60 | Documento de muestra de prompts        | Could     | Mejoras | — (tooling)                         | [F](epic-f-plataforma.md#us-60)  |
| US-61 | Prompts activ. (3–6) + pers. + fecha   | Should    | Mejoras | — (prompts/BD)                      | [B](epic-b-cuentos.md#us-61)     |
| US-62 | Fecha de generación y filtros (Hist.)  | Should    | Mejoras | Historial                           | [D](epic-d-historial.md#us-62)   |
| US-63 | Favoritos (backend: persist. + endpts) | Should    | Mejoras | — (backend/BD)                      | [D](epic-d-historial.md#us-63)   |
| US-64 | Favoritos (UI) + búsqueda (Historial)  | Should    | Mejoras | Historial / Lectura / Actividades   | [D](epic-d-historial.md#us-64)   |

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
  ilustrativo. Para no repetir se usa **dedup simple por título**; la base vectorial (Chroma)
  se descartó ([ADR 0004](../ADR/0004-base-de-datos-vectorial-chroma.md), Rechazada).
- **I-4 ✅ Idioma de los cuentos.** _Decisión:_ `generateStory` produce en `perfil.idioma`.
- **I-5 ✅ Rango de edad.** _Decisión:_ **2-6** (lo que ofrece la UI); el "2-5" del brand
  queda obsoleto.
- **I-6 ✅ Entidad de progreso/historial.** _Decisión:_ el progreso se modela como
  **estado** de `Story`/`Activity` (`completadaEn`, valoración, `nuevo|leído`), sin
  entidad `Progress` aparte (YAGNI).
- **I-7 ✅ Marca vs. paquete.** _Decisión:_ nombre visible **"Aprendizaje Mágico"**; el
  paquete sigue siendo `magyblob`.
