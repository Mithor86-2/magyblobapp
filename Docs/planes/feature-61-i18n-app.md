# Plan — Feature 61: i18n del app (ES/EN) (US-57)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md); coordinación del lote en
> [coordinacion-mejoras-paralelo-2.md](coordinacion-mejoras-paralelo-2.md) (F5). Aquí va el **cómo** se
> trocea y ejecuta.
>
> Rama: `feature/61-i18n-app` (desde `develop`). Solo app. Mejora **F5** del lote nº 2.

## Contexto

Hasta ahora todos los textos de la UI estaban **hardcodeados en español** repartidos por
`presentation/screens/*`, los componentes con texto (`ActivityCard`, `AuthorBadge`,
`NarrationControls`, `ParentalGate`, `ErrorFallback`, y los `label` de `BubblyButton`) y los **títulos
de cabecera del stack** en `App.tsx`. Esta feature introduce **i18n** con `i18next` + `react-i18next`
(recursos `es`/`en` empaquetados) y `expo-localization` como **sugerencia inicial** del idioma del
dispositivo.

**Decisiones clave:**

- **Idioma por defecto y de respaldo = `es`** (CRÍTICO): los textos en español se conservan **idénticos**
  bajo claves, de modo que las pruebas user-centric existentes (que consultan por texto en español)
  siguen verdes sin tocarlas.
- **Init síncrono** de i18next al cargar el módulo (recursos en memoria, sin backend asíncrono, sin
  `Suspense`): `t('clave')` devuelve la cadena correcta desde el primer render. Los tests renderizan
  componentes sin Provider → funciona con la instancia global vía `initReactI18next`.
- **Idioma del APP** (`appLanguage: 'es' | 'en'`, persistido en `useAppStore`, selector en la **zona de
  adultos**) es **independiente** del **idioma del PERFIL** del niño, que gobierna la generación de los
  cuentos en el backend y **no se toca**.
- `expo-localization` solo se usa como **sugerencia inicial** (primer arranque, sin preferencia
  guardada) y únicamente si el idioma del dispositivo es uno de los soportados; si no, `es`.
- **Cumplimiento:** diccionarios empaquetados en build-time, sin red ni descarga de traducciones en
  runtime (conforme a [../cumplimiento-menores.md](../cumplimiento-menores.md)).

**Coordinación:** F5 reescribe **todas** las pantallas igual que F6 (cabeceras) → van **secuenciales**
(F6 → F5). Se respetan `headerImageName` (F6) y `KeyboardAvoidingView`/footer fijo (F1) ya presentes en
`Screen.tsx`; F5 no toca `Screen.tsx` salvo lo necesario.

## Historias cubiertas

- **US-57 — Internacionalización del app (ES/EN)** ([épica F](../historias-usuario/epic-f-plataforma.md#us-57))

## Fases y tareas

### Fase 1 — Andamiaje (docs) ✅

- ✅ US-57 en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md#us-57) (Gherkin) + listado
  de épica F.
- ✅ Fila de trazabilidad en [historias-usuario/README.md](../historias-usuario/README.md) (Should ·
  Mejoras · "Toda la app / Zona adultos" · F).
- ✅ Este plan en `Docs/planes/feature-61-i18n-app.md`.
- ✅ `## [Unreleased]` de [packages/app/CHANGELOG.md](../../packages/app/CHANGELOG.md) con la entrada de
  i18n.

### Fase 2 — Implementación ❌

- ❌ **Dependencias**: `expo install expo-localization`; `add i18next react-i18next`.
- ❌ **Infra i18n** (`src/i18n/`): `index.ts` (init síncrono de i18next con `initReactI18next`, recursos
  `es`/`en`, `lng`/`fallbackLng = 'es'`, `supportedLngs`, `compatibilityJSON: 'v4'` y sin
  `Suspense`); `resources.ts` o `locales/{es,en}.ts` con los diccionarios; helper de detección inicial
  con `expo-localization` (solo sugerencia).
- ❌ **Diccionarios ES/EN**: extraer ~100-150 strings de `presentation/screens/*` (Welcome, Dashboard,
  Home, Login, Consent, CreateProfile, SelectProfile, Activities, StoryGenerator, History, Parental,
  StoryReader), los componentes con texto (`ActivityCard`, `AuthorBadge`, `NarrationControls`,
  `ParentalGate`, `ErrorFallback`) y los **títulos de cabecera** de `App.tsx`. ES = texto actual idéntico.
- ❌ **Integrar `labels.ts`**: los vocabularios cerrados (temas, estilos, parentesco, categorías,
  proveedor) pasan por i18n manteniendo la etiqueta ES idéntica (o claves coherentes consumidas por
  `labels`).
- ❌ **Sustituir hardcodes por `t('clave')`** en pantallas, componentes y títulos del stack.
- ❌ **`appLanguage` en `useAppStore`**: campo `appLanguage: 'es' | 'en'` persistido (subir `version` de
  persistencia y `partialize`), con acción `setAppLanguage` que llama a `i18n.changeLanguage`.
- ❌ **Selector de idioma** en `ParentalScreen` (zona de adultos).
- ❌ **Sincronizar idioma al arrancar**: aplicar `appLanguage` persistido a i18next tras la hidratación;
  si no hay, usar la sugerencia de `expo-localization`.

### Fase 3 — Pruebas y gate ❌

- ❌ Test del cambio de idioma (`t` devuelve ES/EN según idioma activo).
- ❌ Test de que una pantalla renderiza el texto traducido.
- ❌ Ajustar los tests existentes que rompan (deberían seguir verdes si el default es ES y las claves
  devuelven el mismo texto español).
- ❌ `pnpm install` + `pnpm check` en verde (exit 0).
- ❌ Pruebas con el usuario antes del cierre; `finish`/merge solo tras confirmación explícita.

## Notas de diseño (Clean Arch ligera)

- La infra i18n vive en `src/i18n/` (capa de presentación/infra de UI); el **dominio** sigue en español
  y no depende de i18n.
- El **idioma del perfil** (cuentos) es del backend y **no** se mezcla con `appLanguage`.
- No se deshabilita lint; las fronteras de import se respetan.
