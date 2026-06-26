# Epic C — Actividades

Historias: **US-09**, **US-10**. Volver al [índice](README.md).

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
