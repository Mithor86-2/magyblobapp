# ADR 0004 — Chroma como base de datos vectorial (condicional)

- **Estado:** Aceptada
- **Fecha:** 2026-06-10
- **Relacionada con:** [ADR 0001](0001-arquitectura-limpia-monorepo.md)

## Contexto

La recomendación de actividades podría beneficiarse de **búsqueda por similitud**
(embeddings): dado un perfil o una actividad, encontrar las más parecidas. Eso
sugiere una base de datos vectorial. Pero el proyecto sigue **YAGNI por encima de
completitud**: no se añade infraestructura que no demuestre aportar valor, y toda
omisión se justifica por escrito.

## Decisión

Elegir **Chroma** como base de datos vectorial **del proyecto**, dejándola
**provisionada pero de adopción condicional**:

- Chroma se incluye en `docker compose` (puerto `8000`) para que la infraestructura
  esté lista y la reproducibilidad no dependa de añadir servicios a posteriori.
- Su **uso en el código es condicional**: solo se integra en la lógica de
  recomendación **si demuestra aportar** (recomendación por similitud mejor que una
  consulta relacional simple sobre PostgreSQL).
- Si al llegar a esa funcionalidad (Fase 5) **no aporta**, **no se integra** y se
  **documenta por qué se omite**. La decisión de "usar o no" se cierra entonces; esta
  ADR registra el marco y se actualizará con el resultado.

## Alternativas consideradas

- **Sin DB vectorial — solo PostgreSQL.** Para un catálogo pequeño de actividades,
  filtros y reglas relacionales pueden bastar y evitan un servicio extra. Es el
  **fallback por defecto** si Chroma no aporta.
- **`pgvector` (extensión de PostgreSQL).** Evitaría un contenedor adicional al vivir
  dentro de Postgres; alternativa preferente si más adelante se decide que la
  similitud aporta pero Chroma no compensa como servicio aparte.
- **Otras DB vectoriales (Qdrant, Weaviate, Pinecone).** Más capacidades de las
  necesarias para un TFM; Pinecone además es gestionada/de pago. No compensan.

## Consecuencias

**Positivas**

- La infraestructura queda lista sin comprometer todavía la complejidad en el código.
- La decisión final se toma con evidencia (¿mejora la recomendación?), no por
  anticipado.

**Costes / riesgos**

- Un servicio más en `docker compose` que podría acabar sin uso; aceptable porque el
  coste de arranque es bajo y la alternativa (añadirlo tarde) penaliza la
  reproducibilidad.
- Existe el riesgo de "infra zombi": para evitarlo, esta ADR exige **decidir y
  documentar** explícitamente el resultado en la Fase 5 (integrar, sustituir por
  `pgvector`/PostgreSQL, o retirar el servicio).
