# @magyblob/app

App móvil **"Aprendizaje Mágico"** (Expo SDK 56 + React Navigation + Zustand).

Slice vertical del **HITO 1** (Fase 4): recorre el flujo de punta a punta
**consentimiento del adulto → crear perfil → generar cuento** contra el backend real.
Es agnóstica del proveedor de IA: solo llama a `POST /stories`; el modo (mock | local
| cloud) lo decide el backend.

## Arrancar

Necesitas el backend levantado (ver el README raíz). Para la demo con IA local:

```bash
pnpm up:local                 # backend + PostgreSQL + Ollama (AI_PROVIDER=local)
# (una vez) pnpm ollama:setup  # baja gemma:2b al contenedor de Ollama
```

Luego, la app:

```bash
cp packages/app/.env.example packages/app/.env   # ajusta EXPO_PUBLIC_API_URL si usas móvil físico
pnpm --filter @magyblob/app start                # abre Expo (i = iOS sim, a = Android, w = web)
```

> **Dispositivo físico:** `localhost` no alcanza al backend desde el móvil. Pon la
> **IP LAN** del ordenador en `EXPO_PUBLIC_API_URL` (p. ej. `http://192.168.1.42:3000`)
> con el móvil en la misma red. En el simulador iOS `localhost` funciona.

## Estructura (Clean Architecture ligera)

Dependencias hacia dentro: `presentation → domain ← infrastructure`. El composition
root (`src/composition.ts`) es el único módulo que conoce la implementación concreta.

```text
App.tsx               navegación (native-stack) + fuentes + hidratación del store
src/domain/           modelos, vocabularios, interfaces de gateway y ApiError (sin framework)
src/infrastructure/   adaptador HTTP (createApiGateways) + storage (AsyncStorage) + test
src/composition.ts    composition root: api = createApiGateways() (tipado como domain)
src/presentation/
  theme/tokens.ts     design system (paleta coral/menta, Quicksand, tap targets ≥64px)
  store/              estado Zustand (guardianId persistido; perfil de sesión)
  components/         Screen, BubblyButton, SelectableChip, AvatarPicker, TextField… (+ *.test.tsx co-locados)
  screens/            ConsentScreen, CreateProfileScreen, StoryGeneratorScreen
  labels.ts           presentación con acentos de los vocabularios
  navigation.ts       tipos del native-stack
```

## Pruebas y gate

```bash
pnpm --filter @magyblob/app typecheck   # tsc --noEmit
pnpm --filter @magyblob/app test        # vitest: cliente HTTP + componentes
```

El `pnpm check` de la raíz cubre la app en typecheck, formato y tests. El ESLint
raíz ignora `packages/app/**` (toolchain RN aparte).

### Tests user-centric de componentes (US-30)

Los componentes se prueban **como lo haría una persona usuaria**, siguiendo la _Query
Priority_ de Testing Library: `getByRole` → `getByLabelText` → `getByText` (y `testID`
solo como último recurso). Cada test localiza el elemento por su **rol accesible** o su
**texto** y simula la interacción (`fireEvent`), nunca por estructura ni estilos. Hoy
cubren 11 componentes (`BubblyButton`, `ParentalGate`, `TextField`, `SelectableChip`,
`StarRating`, `AvatarPicker`, `AuthorBadge`, `ActivityCard`, `NarrationControls`,
`Screen`, `DialogProvider`).

**Arnés de render** (todo en `devDependencies`, sin impacto en runtime): se renderiza
con `@testing-library/react` sobre `jsdom` aliasando `react-native` → `react-native-web`
(ver [`vitest.config.ts`](vitest.config.ts)). RN-web traduce las props de accesibilidad
a su equivalente ARIA (`accessibilityRole`→`role`, `accessibilityLabel`→`aria-label`,
`accessibilityState`→`aria-*`), que es justo lo que consultan las queries. El entorno
por defecto es `node` (para el test del cliente HTTP); cada test de componente declara
`// @vitest-environment jsdom` en su cabecera. Los matchers de
`@testing-library/jest-dom` se cargan en [`vitest.setup.ts`](vitest.setup.ts).

**Convenciones y límites:**

- Los tests viven co-locados (`Componente.test.tsx` junto al componente).
- El wrapper `Icon` no se prueba directamente: `lucide-react-native` no es importable
  bajo Vitest (módulo ESM incompatible), así que se sustituye por un doble
  (`vi.mock('./Icon', …)`) en los tests que lo arrastran. Su contrato lo cubre US-29.
- Las dependencias pesadas o de IO se mockean (p. ej. `useNarration`, `react-native-safe-area-context`).
