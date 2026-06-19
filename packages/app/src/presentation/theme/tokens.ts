/**
 * Tokens del design system "Aprendizaje Mágico" (fuente de verdad:
 * Docs/Design/stitch_magyblob/aprendizaje_m_gico/DESIGN.md).
 *
 * Paleta "pasteles saturados", tipografía Quicksand, formas redondeadas y
 * tap targets generosos (≥64px) pensados para motricidad de 2-6 años.
 */

export const colors = {
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
} as const;

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

/** Sombra "ambiental suave" (tinte sobre crema, no gris). */
export const softShadow = {
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 4,
} as const;
