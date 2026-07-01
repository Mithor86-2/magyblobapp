# Plan — Feature 77: Tema claro/oscuro reactivo (sistema + manual)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

Rama: `feature/77-tema-dark-light` (desde `develop`). Historia: **US-66**
([épica E](../historias-usuario/epic-e-config.md#us-66)). Naturaleza: **mejora de UX**
post-HITO 2; introduce estado de UI (preferencia de tema) pero **no altera la lógica de negocio**.

## Contexto

La app tenía una **paleta única clara** (`colors` en `presentation/theme/tokens.ts`) consumida por
~26 ficheros vía `StyleSheet.create` a nivel de módulo, con la `StatusBar` fija a `dark` y las barras
del SO sin tematizar. US-66 pide **tema claro/oscuro reactivo** con selección **Sistema + toggle
manual** (Automático / Claro / Oscuro) persistida, coherente además con las **barras del sistema**
(barra de estado y barra de navegación inferior de Android).

**Cumplimiento (Docs/cumplimiento-menores.md):** todo local — `useColorScheme` es una lectura del SO
y `expo-navigation-bar` / `expo-system-ui` son módulos build-time de Expo. Sin red ni SDK de terceros.

## Fases → tareas

### Fase 0 — Dependencias ✅

- ✅ `expo install expo-navigation-bar expo-system-ui` (alineadas a SDK 56).

### Fase 1 — Tokens temáticos ✅

- ✅ `type ColorTokens` (claves de la paleta), `lightColors` (paleta histórica) y `darkColors`
  (superficies oscuras cálidas, texto claro, coral/menta/cielo re-tonalizados para contraste AA).
- ✅ `export const themes = { light, dark }`; `makeSoftShadow(colors)`.
- ✅ Back-compat: `export const colors = lightColors` y `export const softShadow = makeSoftShadow(lightColors)`.

### Fase 2 — ThemeProvider + hooks ✅

- ✅ `resolveScheme(preference, systemScheme)` (función **pura**, testeable).
- ✅ `ThemeContext` con default = tema claro (tests sin provider siguen verdes).
- ✅ `useTheme()` y `useThemedStyles(factory)` (memo por esquema).
- ✅ `ThemeProvider`: lee `themePreference` del store + `useColorScheme()`, resuelve el esquema, y en
  `useEffect` sincroniza las barras del SO (Android: `expo-navigation-bar`; Android/iOS:
  `expo-system-ui`), con guardas por plataforma y `try/catch` (no rompe en web).

### Fase 3 — Store ✅

- ✅ `themePreference: ThemePreference` (default `system`) + `setThemePreference`; en `partialize`; NO
  se borra en `logout`. Bump `version` 4→5 + `migrate`.
- ✅ Tests de `themePreference`/`setThemePreference`, persistencia y logout.

### Fase 4 — Selector + i18n ✅

- ✅ Chips de tema (Automático/Claro/Oscuro) en `ParentalScreen` (patrón del selector de idioma).
- ✅ Claves i18n `parental.theme*` en `es.ts` y `en.ts` (paridad ES/EN mantenida).

### Fase 5 — App.tsx + barras + navegación ✅

- ✅ Árbol envuelto en `<ThemeProvider>` (dentro de `SafeAreaProvider`); subcomponente `ThemedApp`
  consume `useTheme()`.
- ✅ `StatusBar` reactiva (`style` según esquema); tema de `NavigationContainer`, colores de tab bar,
  del "blob" activo y de las cabeceras del stack desde la paleta activa.
- ✅ `app.json`: `userInterfaceStyle: automatic` + `androidNavigationBar`. Las carpetas nativas
  (`android/`, `ios/`) están **gitignored** (workflow managed → prebuild las regenera desde `app.json`);
  no hay ficheros nativos que alinear a mano.

### Fase 6 — Migración de consumidores ✅

- ✅ ~26 ficheros migrados: `StyleSheet.create` de módulo → `makeStyles = (colors: ColorTokens) => …`
  consumido con `useThemedStyles`; colores inline → `useTheme()`; `...softShadow` → `...makeSoftShadow(colors)`.

### Fase 7 — Tests ✅

- ✅ `ThemeProvider.test.ts` (matriz de `resolveScheme`).
- ✅ Store: preferencia de tema.
- ✅ Stubs de `expo-navigation-bar`/`expo-system-ui` aliasados en `vitest.config.ts` (no cargan bajo
  Vitest, como `expo-haptics`); los ~tests de componentes existentes siguen verdes con el default claro.

### Fase 8 — Gate ✅

- ✅ `pnpm check` (typecheck + lint + format:check + test) en verde.
- ✅ `expo export` (bundle web) completa.

## Fuera de alcance / notas

- La verificación visual real de las barras del SO en Android/iOS requiere **dispositivo o build
  nativa**. Como se añaden módulos nativos (`expo-navigation-bar`/`expo-system-ui`), **Expo Go ya no
  arranca la app**: se lanza con un **development build** — `cd packages/app && npx expo run:android`
  (o `npx expo run:ios`). El color de la barra de navegación inferior solo se aprecia en Android nativo.
  Docs de arranque actualizados (READMEs raíz y del app, `estrategia-pruebas.md`, lecciones aprendidas).
- No se añade ESLint específico del app (sigue sin lint propio); la doc del tema es por convención.
