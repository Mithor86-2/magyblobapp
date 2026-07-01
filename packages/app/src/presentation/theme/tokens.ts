/**
 * Tokens del design system "Aprendizaje Mágico" (fuente de verdad:
 * Docs/Design/stitch_magyblob/aprendizaje_m_gico/DESIGN.md).
 *
 * Paleta "pasteles saturados", tipografía Quicksand, formas redondeadas y
 * tap targets generosos (≥64px) pensados para motricidad de 2-6 años.
 *
 * Tema claro/oscuro (US-66): los **colores** viven en dos paletas de la misma
 * forma (`lightColors`/`darkColors`) que se seleccionan en runtime vía el
 * `ThemeProvider`. El resto de tokens (espaciado, radios, tipografía, tamaños)
 * son invariantes al tema. Se conserva `export const colors = lightColors` para
 * no romper los imports estáticos durante la migración ni los tests que
 * renderizan sin provider (contexto por defecto = claro).
 */

/**
 * Contrato de colores del tema: las claves son idénticas en claro y oscuro, de
 * modo que cualquier `StyleSheet` funciona con ambas paletas (US-66).
 */
export type ColorTokens = {
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  primaryBorder: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
  errorContainer: string;
  onErrorContainer: string;
};

/** Paleta clara (la histórica): superficies crema cálidas, coral/menta/cielo. */
export const lightColors: ColorTokens = {
  // Superficies cálidas (crema) para reducir fatiga visual frente al blanco puro.
  surface: '#fff8f6',
  surfaceContainer: '#fceae3',
  surfaceContainerHigh: '#f6e5de',
  // Coral: acciones principales y resaltes emocionales.
  primary: '#9c4143',
  onPrimary: '#ffffff',
  primaryContainer: '#ff8e8e',
  primaryBorder: '#772529', // borde inferior "squishy" de los botones
  // Menta: estados de éxito / naturaleza.
  secondary: '#426561',
  onSecondary: '#ffffff',
  secondaryContainer: '#c2e7e2',
  // Cielo: fondos calmados y navegación.
  tertiary: '#0d6683',
  onTertiary: '#ffffff',
  tertiaryContainer: '#72b8d8',
  // Cocoa: texto cálido (no negro puro) para suavidad.
  onSurface: '#221a16',
  onSurfaceVariant: '#554242',
  outline: '#dbc0bf',
  // Error.
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
};

/**
 * Paleta oscura (US-66): diseño **"cielo nocturno"** (índigo cósmico) definido en
 * Docs/Design/stitch_magyblob/DESIGN_Dark.md. Superficies índigo profundas que
 * evocan un cielo estrellado (más calmado para la transición al sueño), coral como
 * acción principal de alto contraste, púrpura suave como secundario "mágico" y aqua
 * como terciario de pistas/navegación; texto lila claro (no blanco puro para evitar
 * la vibración sobre fondo oscuro). Las claves son las mismas que en claro, así que
 * cualquier `StyleSheet` funciona con ambas paletas sin cambios.
 */
export const darkColors: ColorTokens = {
  // Superficies índigo cósmicas: canvas profundo → contenedores algo más claros.
  surface: '#111125',
  surfaceContainer: '#1e1e32',
  surfaceContainerHigh: '#28283d',
  // Coral: acción principal y momentos de "éxito", alto contraste sobre el índigo.
  primary: '#ffb4a7',
  onPrimary: '#640c04', // texto/icono oscuro sobre el coral
  primaryContainer: '#ff7f6a',
  primaryBorder: '#a43b2c', // "lip" inferior de coral más oscuro (botón extruido)
  // Púrpura suave: interacciones secundarias y elementos decorativos "mágicos".
  secondary: '#d3bcfc',
  onSecondary: '#38265b',
  secondaryContainer: '#523f76',
  // Aqua suave: pistas, rastros de navegación y feedback "gentil".
  tertiary: '#76d5e1',
  onTertiary: '#00363c',
  tertiaryContainer: '#52b2be',
  // Texto lila claro sobre las superficies índigo (evita el blanco puro).
  onSurface: '#e2e0fc',
  onSurfaceVariant: '#dec0bb',
  outline: '#a58b86',
  // Error legible sobre oscuro.
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
};

/** Paletas indexadas por esquema (las selecciona el `ThemeProvider`, US-66). */
export const themes = {
  light: lightColors,
  dark: darkColors,
} as const;

/** Preferencia elegida por la persona adulta: seguir al sistema o forzar un tema. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** Esquema efectivo ya resuelto (lo que realmente se pinta). */
export type Scheme = 'light' | 'dark';

/** Valor por defecto de la preferencia: seguir al sistema operativo (US-66). */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

/**
 * Alias de compatibilidad: apunta a la paleta clara. Se mantiene para los
 * imports estáticos aún no migrados a `useTheme()` y para los tests que
 * renderizan sin provider (donde el contexto ya cae al tema claro).
 */
export const colors = lightColors;

/** Unidad base de 8px; ritmo vertical holgado (24-40px). */
export const spacing = {
  xs: 4,
  sm: 12,
  md: 24,
  lg: 40,
  xl: 64,
  containerPadding: 24, // margen seguro mínimo en móvil
  elementGap: 16,
} as const;

export const radius = {
  sm: 8,
  md: 16, // inputs (formularios de adulto): radio conservador
  lg: 24, // tarjetas/contenedores: mínimo "sin esquinas duras"
  pill: 9999,
} as const;

/** Tamaño mínimo de zona táctil (motricidad infantil). */
export const tapTarget = 64;

/**
 * Tamaños de icono (lucide-react-native). Generosos para una app infantil; el
 * wrapper `Icon` usa `md` por defecto. El contenedor pulsable sigue rigiéndose
 * por `tapTarget` (≥64px), no por el tamaño del glifo.
 */
export const iconSize = {
  sm: 20,
  md: 28,
  lg: 40,
} as const;

/**
 * Familias de Quicksand cargadas en App.tsx vía useFonts. Si las fuentes no
 * cargan, RN cae a la del sistema sin romper la UI.
 */
export const fonts = {
  regular: 'Quicksand_500Medium',
  bold: 'Quicksand_700Bold',
} as const;

export const typography = {
  displayLg: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38 },
  headlineMd: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34 },
  bodyLg: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 30 },
  bodyMd: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 26 },
  labelBold: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20 },
  button: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 24 },
} as const;

/**
 * Sombra "ambiental suave" (tinte sobre la superficie, no gris). Depende del
 * tema porque su color se toma de la paleta activa (US-66): en claro tiñe con el
 * coral; en oscuro conviene un tinte más neutro para que la elevación se lea.
 */
export function makeSoftShadow(c: ColorTokens) {
  return {
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  } as const;
}

/** Sombra suave del tema claro (back-compat para imports estáticos). */
export const softShadow = makeSoftShadow(lightColors);
