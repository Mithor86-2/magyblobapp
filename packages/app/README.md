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

## Estructura

```text
App.tsx                 navegación (native-stack) + carga de fuentes + hidratación del store
src/theme/tokens.ts     design system (paleta coral/menta, Quicksand, tap targets ≥64px)
src/api/                cliente HTTP del backend (+ test) y tipos del contrato de cable
src/store/              estado Zustand (guardianId persistido; perfil de sesión)
src/components/         Screen, BubblyButton, SelectableChip, AvatarPicker, TextField
src/screens/            ConsentScreen, CreateProfileScreen, StoryGeneratorScreen
```

## Pruebas y gate

```bash
pnpm --filter @magyblob/app typecheck   # tsc --noEmit
pnpm --filter @magyblob/app test        # vitest (cliente HTTP)
```

El `pnpm check` de la raíz cubre la app en typecheck, formato y tests. El ESLint
raíz ignora `packages/app/**` (toolchain RN aparte).
