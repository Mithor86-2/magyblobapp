# ADR 0001 — Clean Architecture en un monorepo pnpm

- **Estado:** Aceptada
- **Fecha:** 2026-06-10
- **Contexto del proyecto:** TFM — app infantil bilingüe que crea perfiles y
  genera cuentos / recomienda actividades con un LLM local.

## Contexto

El proyecto debe ser evaluado por su **calidad arquitectónica**, no solo por que
funcione. Necesita una lógica de negocio comprobable de forma aislada (la
generación de cuentos y la recomendación de actividades son el núcleo) y una capa
de IA que pueda intercambiarse entre mock, local y nube sin tocar el dominio (ver
[ADR 0002](0002-tres-modos-de-ia.md)). Además conviven dos artefactos —un backend
y una app móvil— que comparten contratos.

## Decisión

Adoptar **Clean Architecture** con las dependencias apuntando hacia adentro, en un
**monorepo** gestionado con **pnpm workspaces** (paquetes `backend` y `app`).

Capas:

- **`/domain`** — entidades (`ChildProfile`, `Story`, `Activity`), value-objects e
  **interfaces de repositorio**. Lógica de negocio pura: **cero dependencias
  externas**, sin frameworks ni IO.
- **Aplicación** — casos de uso (`CreateChildProfile`, `RecommendActivities`,
  `SaveProgress`, `GetHistory`), cada uno con su test, y los DTOs de entrada/salida.
- **Infraestructura** — repositorios PostgreSQL que implementan las interfaces del
  dominio, controllers/routes HTTP, manejo de errores centralizado, migraciones y
  seeds.

La capa de IA se expone como una interfaz del dominio/aplicación (`AIProvider`) y
sus implementaciones viven en infraestructura.

## Alternativas consideradas

- **Arquitectura en capas tradicional / MVC monolítico.** Más rápida de arrancar,
  pero acopla la lógica de negocio al framework HTTP y al ORM, dificultando probar
  los casos de uso y, sobre todo, intercambiar la capa de IA — que es el corazón
  del proyecto.
- **Polyrepo (un repo por paquete).** Aísla mejor pero añade fricción de versionado
  y CI para un proyecto de un solo autor; no compensa.
- **Turborepo.** Válido, pero pnpm workspaces basta para dos paquetes y evita una
  herramienta extra (YAGNI).

## Consecuencias

**Positivas**

- El dominio es testeable sin DB, sin red y sin IA: los tests de casos de uso son
  rápidos y deterministas.
- La regla "el dominio no depende de nada" hace evidente cualquier fuga de
  acoplamiento (un import de framework en `/domain` es un error visible).
- Cambiar de ORM, de framework HTTP o de proveedor de IA no toca la lógica de
  negocio.

**Costes / riesgos**

- Más ceremonia inicial (interfaces + DTOs) frente a un CRUD directo.
- Riesgo de **sobre-ingeniería**, que el proyecto mitiga explícitamente con YAGNI:
  value-objects solo donde aportan (`edad`, `idioma`), no inventar abstracciones que
  no pagan su coste. Las omisiones se justifican por escrito.
