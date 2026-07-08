/**
 * Stub de `expo-constants` para los tests: arrastra `expo-modules-core` (nativo) y no
 * carga bajo Vitest. Expone un `expoConfig.version` fijo para que `VersionFooter`
 * renderice de forma estable (mismo criterio que el stub de `expo-application`).
 */
export default {
  expoConfig: { version: '1.8.0' as string | undefined },
};
