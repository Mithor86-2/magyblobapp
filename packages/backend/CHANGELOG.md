# Changelog

Todos los cambios destacables del paquete `@magyblob/backend` se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.1.0] - 2026-06-11

Primer incremento con seguimiento de changelog (las Fases 0-3 son anteriores a esta
convención). Feature 1 de la Fase 5 (US-09): recomendación de actividades con IA.

### Added

- Caso de uso `RecommendActivities` (genera actividades con `AIProvider`, las persiste y
  aplica **dedup simple por título** frente a las del perfil) + DTOs `RecommendActivitiesRequest`
  / `ActivityOutput`.
- `ActivityRepository` (puerto en `domain`) + `PrismaActivityRepository` (impl PostgreSQL);
  `activities` añadido a `AppDeps` y al composition root.
- Ruta `POST /activities/recommend` con validación por JSON Schema (categoría del vocabulario,
  cantidad 1-5) + test de integración. Test del caso de uso con dobles en memoria.
