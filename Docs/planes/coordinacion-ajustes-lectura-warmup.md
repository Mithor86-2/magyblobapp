# Plan — Ajustes: warm-up visible, lector anónimo y corte de última línea

Lote de **3 ajustes** ejecutados **en paralelo** (un worktree por feature desde `develop`),
integrados en bloque con **versionado diferido**. Fuente de las historias:
[historias-usuario/](../historias-usuario/README.md). Estado por fase en [phases.md](../phases.md).

**Decisiones de diseño acordadas con el usuario:**

- Ajuste 1 → **banner no bloqueante** (la app es navegable mientras el servidor despierta).
- Estrategia → **3 worktrees en paralelo**; único fichero compartido: locales i18n
  (`es.json`/`en.json`), conflicto menor resoluble al integrar.

**Reparto de ficheros (para minimizar solapes):**

| Feature           | Rama                            | Ficheros propios                                                                                       |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| F1 warm-up        | `feature/95-warmup-banner`      | `infrastructure/http.ts`, `presentation/hooks/useServerWarmup.ts` (nuevo), `App.tsx`, `composition.ts` |
| F2 lector anónimo | `feature/96-lector-anonimo`     | `screens/DashboardScreen.tsx`, `screens/StoryReaderScreen.tsx`, `presentation/navigation.ts`           |
| F3 corte de línea | `feature/97-corte-ultima-linea` | `screens/paginarCuento.ts`, `components/BookPages.tsx`                                                 |
| (compartido)      | —                               | `i18n/locales/es.json`, `i18n/locales/en.json`                                                         |

Leyenda: ✅ hecho · 🔄 en curso · ⬜ pendiente

---

## F1 · US-95 — Warm-up visible al arrancar (banner no bloqueante)

**Problema:** ya existe `warmUp()` (ping a `/health` con reintentos) pero es **silencioso**;
el usuario no sabe que el backend (Render free) está despertando del cold start.

- [x] **T1.1** Exponer el estado del warm-up desde `http.ts` sin romper la llamada de
      `composition.ts` (p. ej. `warmUp()` acepta callback de estado o versión que devuelve
      `Promise<boolean>`; mantener el best-effort actual).
- [x] **T1.2** Hook `useServerWarmup()` → `'warming' | 'ready'`: arranca al montar, pasa a
      `ready` cuando `/health` responde o al agotar reintentos (nunca deja el banner pegado).
- [x] **T1.3** Banner superpuesto no bloqueante en `App.tsx` (`ThemedApp`) con
      `t('warmup.deploying')` mientras `warming`; la app sigue navegable.
- [x] **T1.4** i18n: `warmup.deploying` (ES/EN).
- [x] **T1.5** Tests: `useServerWarmup.test.ts` (warming→ready y timeout con `fetch` mockeado);
      ajustar `http.test.ts` si cambia la firma de `warmUp`.

**DoD F1:** banner visible en cold start y ausente cuando `/health` responde rápido (local);
`pnpm --filter @magyblob/app check` verde.

## F2 · US-96 — Cuento anónimo abre el lector con puerta de sesión

**Problema:** en `DashboardScreen` (sin login) el cuento se pinta **inline**; debe abrir el
**lector** como con sesión, pero las acciones que requieren cuenta deben pedir iniciar sesión.

- [x] **T2.1** `navigation.ts`: `StoryReader` acepta `anonimo?: boolean`.
- [x] **T2.2** `DashboardScreen`: al generar, **navegar** a `StoryReader` con un `Story`
      adaptado (`id/profileId:'anon'`, `estado:'nuevo'`, sin `portada`) y `anonimo: true`, en
      vez de pintarlo inline. Conservar contador efímero y sección de actividades.
- [x] **T2.3** `StoryReaderScreen`: en modo `anonimo`, las acciones **Escuchar**, **Marcar
      como leído**, **Favorito** y **Continuar historia** abren una **modal** (`useDialog().confirm`):
      título "Inicia sesión para continuar", botón principal **"Crear cuenta"** →
      `navigation.navigate('Consent')`, secundario "Ahora no". Omitir el auto-prompt de
      marcar-leído al final. La lectura del libro (pasar páginas) funciona igual.
- [x] **T2.4** i18n: claves de la modal de puerta de sesión (ES/EN).
- [x] **T2.5** Tests: `DashboardScreen.test.tsx` (genera → navega con `anonimo:true`, no pinta
      inline); `StoryReaderScreen.test.tsx` (en `anonimo`, Escuchar/Marcar leído abren modal y
      el botón lleva a `Consent`; sin `anonimo`, comportamiento actual intacto).

**DoD F2:** flujo sin sesión: generar → lector; acciones → modal → alta; con sesión intacto;
`pnpm --filter @magyblob/app check` verde.

## F3 · US-97 — Arreglar la última línea recortada del cuento

**Problema:** hoja de alto fijo (320–460 px) + `paginarCuento` a 120 palabras/página → en
pantallas pequeñas el texto desborda y `borderRadius` recorta la última línea.

- [x] **T3.1** Bajar `palabrasPorPagina` a un objetivo que quepa en el alto **mínimo** de hoja
      (~60), manteniendo `minPaginas`.
- [x] **T3.2** `BookPages`: red de seguridad para fuentes accesibles/palabras largas — el texto
      **encoge para caber** (`adjustsFontSizeToFit`/`numberOfLines` acorde al alto) y se alinea
      arriba reservando el hueco del número de página, para no recortar ni solapar.
- [x] **T3.3** Tests: ampliar `paginarCuento.test.ts` (ninguna página supera el nuevo objetivo;
      se mantiene `minPaginas`); test de `BookPages` que verifique que el texto completo se renderiza.

**DoD F3:** ninguna página recorta la última línea; `pnpm --filter @magyblob/app check` verde.

---

## Integración y cierre (secuencial, tras las 3 features)

- [ ] Integrar F1, F2, F3 en `develop` (resolver conflicto menor de locales i18n).
- [ ] **Versionado diferido** (skill `versionar`): asignar versión y mover `## [Unreleased]`.
- [ ] Docs vivos: `phases.md`, `historias-usuario/` (US-95/96/97 + trazabilidad), CHANGELOG.
- [ ] **Gate verde** `pnpm check` tras integrar.
- [ ] Pruebas manuales con el usuario en develop local; **no** `git flow feature finish` sin su "sí".
