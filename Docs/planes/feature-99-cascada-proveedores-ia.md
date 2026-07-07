# Plan — US-99: cascada de proveedores de IA + versión en Dashboard + autor por proveedor cloud

Rama `feature/99-cascada-proveedores-ia` desde `develop`. Backend + app.
Historia en [historias-usuario/epic-f-plataforma.md#us-99](../historias-usuario/epic-f-plataforma.md#us-99).

Tres ajustes pedidos por el usuario:

1. **Cascada Gemini → Groq → mock** (plan A): el modo cloud intenta el proveedor primario;
   si no responde, el siguiente de la cadena; y por último el mock. Configurable por BD.
2. **Versión en la pantalla sin sesión** (Dashboard): mostrar el `VersionFooter`.
3. **Autor por proveedor cloud**: el `AuthorBadge` de cuentos y actividades distingue el
   proveedor cloud concreto añadiendo al final **G** (Gemini) / **GQ** (Groq) (y OR/CB para
   openrouter/cerebras), manteniendo el icono/etiqueta de "IA en la nube".

Leyenda: ✅ hecho · 🔄 en curso · ⬜ pendiente

## Fase 1 — Cascada de proveedores (backend)

- [x] **T1** `cloudSettings.ts`: `CloudSetting` gana `fallbacks?: {target, model}[]` (opcional,
      retrocompatible); esquema Zod validado (target conocido, model no vacío).
- [x] **T2** `createAIProvider.ts` (`resolver`): cadena ordenada `[primario, …fallbacks]`,
      descartando pasos **sin API key** (con `warn`), anidando `FallbackProvider` de derecha a
      izquierda y terminando en **mock**. Ningún paso con key → modo base (como ahora).
- [x] **T3** `prisma/app-settings.json`: default `ai.cloud` con target `gemini`
      (`gemini-2.5-flash`) y `fallbacks` a `groq` (`llama-3.3-70b-versatile`). **Bump de la
      `version`** de la clave para que el sync versionado lo aplique en deploy.

## Fase 2 — Proveedor cloud concreto en el autor (backend)

- [x] **T4** `domain/vocabulary.ts`: ensanchar `PROVEEDORES_IA` con los targets cloud
      (gemini, groq, openrouter, cerebras). La columna `proveedor` es `String`: sin migración.
- [x] **T5** `CloudProvider`: opción `proveedor: ProveedorIa` (= su `target`); se estampa en
      `generateStory`/`recommendActivities` (y el log) en vez del literal `'cloud'`.
- [x] **T6** `createAIProvider` pasa `proveedor: s.target` al construir cada `CloudProvider`.

## Fase 3 — App (versión + badge)

- [x] **T7** `domain/types.ts`: ensanchar `PROVEEDORES_IA` igual que el backend (los schemas Zod
      lo heredan por `z.enum(PROVEEDORES_IA)`).
- [x] **T8** `Icon.tsx`: `prov-gemini`/`prov-groq`/`prov-openrouter`/`prov-cerebras` → icono `Cloud`.
- [x] **T9** i18n `vocab.proveedor.*` (ES/EN): gemini="IA en la nube (G)", groq="… (GQ)",
      openrouter="… (OR)", cerebras="… (CB)".
- [x] **T10** `DashboardScreen.tsx`: añadir `<VersionFooter />` al pie (pantalla sin sesión).

## Tests

- [x] **T11** `cloudSettings.test.ts`: `fallbacks` válido; retrocompat sin `fallbacks`; `fallbacks`
      inválido → `null`.
- [x] **T12** `createAIProvider.test.ts`: la cadena cae al siguiente ante fallo (Gemini 429 → Groq
      OK; ambos fallan → mock); se omiten pasos sin key; el `proveedor` estampado es el target que
      sirvió.
- [x] **T13** app `AuthorBadge.test.tsx`: `gemini` muestra "G", `groq` muestra "GQ".
- [x] **T14** app `DashboardScreen.test.tsx`: se renderiza la versión.

**DoD:** `pnpm check` verde (+ `pnpm coverage`). Verificación local con la cascada real
(Gemini→Groq) y el badge distinguiendo G/GQ.
