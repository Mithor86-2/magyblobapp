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
  components/         Screen, BubblyButton, SelectableChip, AvatarPicker, TextField
  screens/            ConsentScreen, CreateProfileScreen, StoryGeneratorScreen
  labels.ts           presentación con acentos de los vocabularios
  navigation.ts       tipos del native-stack
```

## Pruebas y gate

```bash
pnpm --filter @magyblob/app typecheck   # tsc --noEmit
pnpm --filter @magyblob/app test        # vitest (cliente HTTP)
```

El `pnpm check` de la raíz cubre la app en typecheck, formato y tests. El ESLint
raíz ignora `packages/app/**` (toolchain RN aparte).
