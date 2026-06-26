---
name: nueva-pantalla
description: Andamia una pantalla del app Expo de magyblobApp respetando su Clean Architecture ligera — tipos/gateway en domain, adaptador en infrastructure/http, estado en store Zustand o useState, pantalla en presentation/screens consumiendo el api inyectado y los tokens de theme, y registro en el navegador. Úsala al añadir una pantalla o flujo nuevo a la app móvil.
---

# Nueva pantalla (app)

Guía para añadir una pantalla de extremo a extremo en **`packages/app`** respetando la Clean
Architecture ligera del refactor: **`domain` → `infrastructure` → `presentation`**, con las
dependencias apuntando al dominio. Trabaja de dentro hacia fuera.

Stack: Expo + React Navigation (NativeStack), Zustand con persistencia (`@react-native-async-storage`),
tokens de diseño en `presentation/theme`. Vocabulario de dominio en español, andamiaje en inglés.

Patrón de referencia ya en el repo: `ConsentScreen` y `CreateProfileScreen`.

## 1. Dominio — tipos y gateway (solo si llama al backend)

- **Tipos** en `src/domain/types.ts`: interfaces espejo de los DTOs del backend y vocabularios
  cerrados (`as const` + tipo derivado). ASCII en minúscula para los códigos (`'animales'`), igual
  que el backend.
- **Gateway** en `src/domain/gateways.ts`: puerto segregado por agregado (no un cliente monolítico),
  y añade el campo a la interfaz `Api`:

  ```ts
  export interface ActivityGateway {
    recommend(input: RecommendActivitiesInput): Promise<Activity[]>;
  }
  export interface Api {
    /* …existentes… */
    activities: ActivityGateway;
  }
  ```

- El dominio **no importa** React, fetch ni Expo. Los errores los modela `ApiError`
  (`src/domain/errors.ts`), lanzado por infraestructura y capturado en la pantalla.

## 2. Infraestructura — implementación del gateway

En `src/infrastructure/http.ts`, dentro de `createApiGateways(baseUrl)`, implementa el nuevo gateway
usando el helper `request<T>()` (ya mapea errores de red y del backend a `ApiError`):

```ts
activities: {
  recommend: (input) =>
    request<Activity[]>(baseUrl, '/activities/recommend', { method: 'POST', body: input }),
},
```

La URL base sale de `EXPO_PUBLIC_API_URL` (no la hardcodees). Si añades persistencia local nueva,
reutiliza `persistStorage` de `src/infrastructure/storage.ts`. Añade su test en
`src/infrastructure/http.test.ts` (Vitest, `vi.stubGlobal('fetch', …)`): verifica método, URL, body
y el mapeo de error a `ApiError`.

## 3. Estado — store Zustand o useState

- **Transitorio** (solo vive en la sesión/pantalla): `useState` local en la pantalla.
- **Persistente o compartido entre pantallas**: amplía `src/presentation/store/useAppStore.ts`
  (acción `set*`, y si debe sobrevivir reinicios, inclúyelo en `partialize`). Recuerda: solo persiste
  lo imprescindible (anclas de cumplimiento como `guardianId`); el resto es transitorio. Lee con
  selectores: `useAppStore((s) => s.campo)`.

## 4. Presentación — pantalla y componentes

- **Pantalla** en `src/presentation/screens/<Nombre>Screen.tsx`:

  ```tsx
  import { api } from '../../composition';
  import { useAppStore } from '../store/useAppStore';
  import { colors, spacing, typography } from '../theme/tokens';
  import { ApiError } from '../../domain/errors';
  import type { ScreenProps } from '../navigation';

  export function <Nombre>Screen({ navigation }: ScreenProps<'<Nombre>'>) {
    // useState para el form / estado local
    // async onSubmit(): llama api.<gateway>.<accion>(...), captura ApiError → Alert,
    //   escribe en el store si procede, navega con navigation.replace/navigate
    return <Screen footer={<BubblyButton label="…" onPress={onSubmit} />}>{/* … */}</Screen>;
  }
  ```

  Usa el `api` inyectado desde `../../composition` (nunca importes `infrastructure/http` directo en
  la pantalla). Etiquetas con acentos vienen de `src/presentation/labels.ts` (mapas `*_LABEL`), no
  hardcodeadas sobre los códigos de dominio.

- **Componentes** reutilizables en `src/presentation/components/`: props con interface explícita
  (no `React.FC`), **dumb** (no consumen store ni gateway), estilos en `StyleSheet.create()`,
  tokens del theme, y accesibilidad (`accessibilityRole`, `accessibilityState`). Respeta `tapTarget`
  (objetivo táctil grande para motricidad infantil). Reutiliza `Screen`, `BubblyButton`,
  `SelectableChip`, `TextField` antes de crear uno nuevo.

- **Theme**: importa tokens de `presentation/theme/tokens` (`colors`, `spacing`, `radius`,
  `typography`, `tapTarget`). No introduzcas colores/medidas sueltos.

## 5. Navegación

- Añade la ruta a `RootStackParamList` en `src/presentation/navigation.ts`
  (`<Nombre>: undefined` o con parámetros tipados).
- Registra `<Stack.Screen name="<Nombre>" component={<Nombre>Screen} />` en `App.tsx`. Si cambia el
  flujo inicial, ajusta la lógica de `initialRouteName` (que depende del estado hidratado del store).

## 6. Cierra el gate

```bash
pnpm check    # el gate cubre typecheck/format/test del app
```

> Nota del repo: el ESLint raíz ignora `packages/app/**`; el `app` extiende `expo/tsconfig.base`.
> Aun así, mantén el patrón de capas (la pantalla no importa infraestructura; los componentes no
> importan dominio ni store). Cuando la feature complete, ciérrala con la skill **cerrar-feature**.

## Checklist de la pantalla

- [ ] Tipos en `domain/types.ts` y gateway en `domain/gateways.ts` (+ campo en `Api`) si llama al backend.
- [ ] Gateway implementado en `infrastructure/http.ts` con su test (`http.test.ts`).
- [ ] Estado decidido: `useState` (transitorio) o `useAppStore` (persistente/compartido, con `partialize`).
- [ ] Pantalla en `presentation/screens` consumiendo `api` de `composition` y tokens de `theme`.
- [ ] Etiquetas vía `labels.ts`; componentes reutilizados o creados como dumb components.
- [ ] Ruta en `navigation.ts` + `<Stack.Screen>` en `App.tsx`.
- [ ] `pnpm check` verde.
