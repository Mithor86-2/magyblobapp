/**
 * Tema claro/oscuro reactivo de la app (US-66).
 *
 * Provee la paleta de colores activa a todo el árbol de presentación y la
 * conmuta entre claro y oscuro según la **preferencia de la persona adulta**
 * (`system` / `light` / `dark`, persistida en el store) combinada con el
 * esquema del sistema operativo. Cumplimiento (Docs/cumplimiento-menores.md):
 * todo es local — `useColorScheme` es una lectura del SO y `expo-navigation-bar`
 * / `expo-system-ui` son módulos build-time de Expo; sin red ni SDK de terceros.
 *
 * El contexto por defecto es el **tema claro**, de modo que los componentes que
 * se rendericen sin `ThemeProvider` (los tests unitarios) sigan funcionando con
 * la paleta histórica sin cambios.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { useAppStore } from '../store/useAppStore';
import {
  type ColorTokens,
  DEFAULT_THEME_PREFERENCE,
  lightColors,
  type Scheme,
  type ThemePreference,
  themes,
} from './tokens';

// Re-exporta los tipos y el default del tema (definidos en tokens para evitar el
// ciclo store→theme→store) para que el resto de la app siga importándolos de aquí.
export { DEFAULT_THEME_PREFERENCE };
export type { ColorTokens, Scheme, ThemePreference };

/**
 * Resuelve el esquema efectivo a partir de la preferencia y el esquema del SO.
 * Función pura (testeable en aislamiento): si la preferencia es `system` toma el
 * esquema del sistema (y cae a `light` cuando el SO no lo reporta); en otro caso
 * respeta la preferencia explícita.
 */
export function resolveScheme(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): Scheme {
  if (preference === 'system') return systemScheme ?? 'light';
  return preference;
}

interface ThemeValue {
  colors: ColorTokens;
  scheme: Scheme;
}

const ThemeContext = createContext<ThemeValue>({ colors: lightColors, scheme: 'light' });

/** Devuelve la paleta y el esquema activos del tema (US-66). */
export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/**
 * Construye estilos temáticos memoizados por esquema: recibe una fábrica que
 * toma la paleta y devuelve el `StyleSheet`, y solo la re-evalúa cuando cambia
 * el tema. Sustituye al `StyleSheet.create` de nivel de módulo (US-66).
 */
export function useThemedStyles<T>(factory: (c: ColorTokens) => T): T {
  const { colors, scheme } = useTheme();
  // `scheme` identifica la paleta; basta con él como dependencia de memo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(colors), [scheme]);
}

/**
 * Fija el color de fondo raíz de la ventana con `expo-system-ui` (US-66). En
 * Android, con edge-to-edge la barra de navegación inferior es transparente y
 * deja ver este fondo, de modo que tiñe el marco del SO de forma coherente con la
 * app; en iOS ajusta el fondo raíz. Defensivo: acotado por plataforma y con
 * `catch` para no romper en web ni si el módulo no está disponible.
 *
 * El **estilo de los botones/iconos** de la barra de navegación de Android NO se
 * fija aquí: en SDK 56 `expo-navigation-bar` retiró los setters imperativos y lo
 * expone como el componente `<NavigationBar style>`, que se renderiza abajo.
 */
function aplicarFondoSistema(colors: ColorTokens): void {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    void SystemUI.setBackgroundColorAsync(colors.surface).catch(() => {});
  }
}

/**
 * Provee el tema al árbol: lee la preferencia del store y el esquema del SO,
 * resuelve el esquema efectivo, expone la paleta por contexto, sincroniza el
 * fondo raíz del SO y, en Android, ajusta el estilo de los botones de la barra de
 * navegación inferior mediante `<NavigationBar>` (US-66).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useAppStore((s) => s.themePreference);
  // `useColorScheme` puede devolver `'light' | 'dark' | null`; RN tipa además
  // `'unspecified'` que normalizamos a `null` (esquema desconocido → claro).
  const systemScheme = useColorScheme();
  const scheme = resolveScheme(
    preference,
    systemScheme === 'light' || systemScheme === 'dark' ? systemScheme : null,
  );
  const colors = themes[scheme];

  useEffect(() => {
    aplicarFondoSistema(colors);
  }, [colors]);

  const value = useMemo<ThemeValue>(() => ({ colors, scheme }), [scheme, colors]);
  return (
    <ThemeContext.Provider value={value}>
      {/* Barra de navegación de Android: `style="dark"` → barra oscura con iconos
          claros (tema oscuro) y viceversa. No-op fuera de Android. */}
      {Platform.OS === 'android' ? (
        <NavigationBar style={scheme === 'dark' ? 'dark' : 'light'} />
      ) : null}
      {children}
    </ThemeContext.Provider>
  );
}
