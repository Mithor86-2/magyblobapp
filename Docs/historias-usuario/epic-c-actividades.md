# Epic C — Actividades

Historias: **US-09**, **US-10**, **US-67**. Volver al [índice](README.md).

## US-09 — Ver actividades recomendadas · Should

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

## US-10 — Registrar actividad completada · Should

Como **padre/tutor** quiero registrar que mi hijo/a completó una actividad con una
valoración para llevar seguimiento del progreso.

**Criterios de aceptación**

- Dada una actividad, Cuando se marca como completada con una valoración (estrellas),
  Entonces el caso de uso `SaveProgress` la persiste con fecha.
- Dado un registro de progreso, Cuando consulto el Historial, Entonces aparece en
  "Actividades hechas" con su fecha y valoración.
- (Mejoras) Dada una actividad sin completar, Cuando pulso el botón **"Realizado"**, Entonces se me
  pide la valoración (1-3 estrellas) y al elegirla se registra la actividad como completada
  (`complete`); el botón es una entrada explícita además de tocar directamente las estrellas.

## US-67 — Actividades más significativas con instrucciones de al menos 6 pasos · Mejoras

Como **padre/tutor** quiero que las actividades recomendadas sean más significativas y con
instrucciones detalladas para poder realizarlas paso a paso con mi hijo/a de 2 a 6 años.

**Criterios de aceptación**

- Dado el prompt de `RecommendActivities` (ES y EN), Cuando se construye, Entonces pide instrucciones
  en un paso a paso de **al menos 6 pasos numerados**, detallados y concretos (cada paso explica qué
  hace el adulto y qué hace el niño).
- Dado ese prompt, Cuando se construye, Entonces pide además un **objetivo de aprendizaje** breve y
  una lista de **materiales sencillos** que suele haber en casa, manteniendo lenguaje simple,
  seguridad y tono apropiado para 2-6 años.
- Dado el guardián con sesión y su **parentesco** (madre/padre/tutor legal/abuelo-a/otro), Cuando se
  generan las actividades, Entonces las instrucciones se dirigen al adulto por su trato ("mamá",
  "papá", "la abuela o el abuelo", "el tutor o la tutora") en vez de "el adulto"; sin parentesco
  (p. ej. modo anónimo) se usa un trato genérico ("la persona adulta").
- Dada la plantilla configurable `prompt.activity.template` (seed), Cuando se siembra, Entonces
  **coincide** con el default en código (≥6 pasos detallados, objetivo y materiales de casa).
- Dado `AI_PROVIDER=mock` o IA caída, Cuando pido actividades, Entonces el fallback a mock devuelve
  instrucciones con **al menos 6 pasos** numerados (política "sanea, no rechaza": `instrucciones`
  sigue opcional y saneada, sin validación dura de recuento).

## US-77 — Trato al adulto por parentesco + nombre {#us-77}

> **Ajuste (lote 2 de ideas):** el seed `prompt.activity.system` (v6) refuerza que la IA use el trato del adulto CON su nombre ("mamá Ana", "abuela Ana") tal cual se le indica; antes la IA real solo ponía el trato.

**Como** adulto responsable, **quiero** que las instrucciones de las actividades se dirijan a mí por mi
parentesco y mi nombre (p. ej. "abuela Ana"), **para** que la guía sea cercana y personal.

**Prioridad:** Should · **Fase:** Mejoras · **Pantalla:** — (prompts actividades).

**Alcance**

1. **`terminoCuidador`** combina el trato por parentesco con el nombre del adulto de la sesión
   ("mamá Ana", "abuela/o Ana"); sin nombre (anónimo) mantiene el trato genérico (US-67).
2. **`RecommendActivities`** pasa `guardian.nombre` al `AIProvider`; el prompt y el `MockProvider` lo usan.

**Criterios de aceptación**

- **(Con nombre)** Dado un guardián "Ana" con parentesco "madre", Cuando se recomiendan actividades,
  Entonces el trato en las instrucciones es "mamá Ana".
- **(Sin nombre)** Dado el modo anónimo (sin nombre), Entonces se usa el trato genérico ("la persona
  adulta").

## US-81 — Pasos de actividad plegables {#us-81}

> **Ajuste (lote 2 de ideas):** `ActivityCard` acepta `pasosVisiblesInicial`; el generador (`ActivitiesScreen`) lo pasa `true` para que los pasos salgan VISIBLES al generar; en Historial/Búsqueda siguen plegados.

**Como** adulto responsable, **quiero** que los pasos de la actividad estén ocultos tras un botón,
**para** ver primero el resumen y desplegar el paso a paso solo cuando lo necesito.

**Prioridad:** Should · **Fase:** Mejoras · **Pantalla:** Actividades / Historial.

**Alcance**

1. **`ActivityCard`:** las instrucciones empiezan **plegadas**; un botón **"Ver pasos"** las despliega
   y, desplegadas, el botón pasa a **"Ocultar pasos"**. i18n ES/EN. Si no hay instrucciones, no hay botón.

**Criterios de aceptación**

- **(Plegado)** Dada una actividad con instrucciones, Cuando se muestra, Entonces los pasos están
  ocultos y se ve "Ver pasos".
- **(Desplegar/Plegar)** Cuando pulso "Ver pasos" se muestran los pasos y el botón pasa a "Ocultar
  pasos"; al pulsarlo se vuelven a ocultar.
- **(Sin pasos)** Dada una actividad sin instrucciones, Entonces no aparece el botón de pasos.
