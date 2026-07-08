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

import type { Categoria, Ensenanza, Estilo, Tema } from '../../domain/types';

/**
 * Clave de color por **valor de vocabulario** (US-100): cada tema, estilo, enseñanza y
 * categoría tiene su color propio y estable en toda la app. Al ser la unión de los cuatro
 * vocabularios, un mismo texto comparte clave (p. ej. `musica` es tema **y** categoría), de
 * modo que "Música" se pinta con el mismo color en cualquier sitio.
 */
export type CategoryColorKey = Tema | Estilo | Ensenanza | Categoria;

/** Color de una categoría/valor: el `color` base (borde/icono/relleno) y el `on` legible encima. */
export type CategoryColor = { color: string; on: string };

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
  /** Borde inferior "squishy" (tono oscuro del secundario) — sombra del botón (US-87). */
  secondaryBorder: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  /** Borde inferior "squishy" (tono oscuro del terciario) — sombra del botón (US-87). */
  tertiaryBorder: string;
  // Cuaternario (ámbar/dorado): 4º color de acción para distinguir "Mis logros" del resto
  // de botones, con color fijo entre pantallas (US-87, ajuste #6).
  quaternary: string;
  onQuaternary: string;
  quaternaryBorder: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  /** Borde inferior "squishy" (tono oscuro del error) — sombra del botón destructivo (US-87). */
  errorBorder: string;
  /**
   * Color por **valor de vocabulario** (US-100): tema/estilo/enseñanza/categoría → color propio.
   * Fuente única del color por valor; lo consume el resolvedor `vocabColor`.
   */
  category: Record<CategoryColorKey, CategoryColor>;
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
  secondaryBorder: '#2d4744', // tono oscuro del menta (borde del botón)
  // Cielo: fondos calmados y navegación.
  tertiary: '#0d6683',
  onTertiary: '#ffffff',
  tertiaryContainer: '#72b8d8',
  tertiaryBorder: '#084b60', // tono oscuro del cielo (borde del botón)
  // Ámbar/dorado: 4º color de acción ("Mis logros").
  quaternary: '#8a5300',
  onQuaternary: '#ffffff',
  quaternaryBorder: '#5e3900', // tono oscuro del ámbar (borde del botón)
  // Cocoa: texto cálido (no negro puro) para suavidad.
  onSurface: '#221a16',
  onSurfaceVariant: '#554242',
  outline: '#dbc0bf',
  // Error.
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  errorBorder: '#8c1414', // tono oscuro del rojo (borde del botón destructivo)
  // Color por valor de vocabulario (US-100): tonos medios saturados con texto blanco encima.
  category: {
    // Temas.
    animales: { color: '#3f8a5c', on: '#ffffff' }, // verde
    aventuras: { color: '#1f6f9c', on: '#ffffff' }, // azul cielo
    musica: { color: '#9c4143', on: '#ffffff' }, // coral (compartido con la categoría "Música")
    espacio: { color: '#3f4d9c', on: '#ffffff' }, // índigo
    magia: { color: '#7a3f9c', on: '#ffffff' }, // púrpura
    // Estilos.
    aventura: { color: '#6b8e23', on: '#ffffff' }, // oliva
    divertido: { color: '#c2477a', on: '#ffffff' }, // magenta
    educativo: { color: '#2f5aa0', on: '#ffffff' }, // azul marino
    // Enseñanzas.
    amistad: { color: '#c26a2f', on: '#ffffff' }, // naranja tostado
    emociones: { color: '#a83f6b', on: '#ffffff' }, // frambuesa
    valentia: { color: '#3f7a9c', on: '#ffffff' }, // azul acero
    honestidad: { color: '#5a7a3f', on: '#ffffff' }, // verde oliva oscuro
    // Categorías de actividad ("musica" comparte entrada con el tema).
    arte: { color: '#b5651d', on: '#ffffff' }, // naranja/ámbar
    logica: { color: '#1f8a8a', on: '#ffffff' }, // teal
  },
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
  secondaryBorder: '#a487d6', // tono oscuro del púrpura claro (borde del botón)
  // Aqua suave: pistas, rastros de navegación y feedback "gentil".
  tertiary: '#76d5e1',
  onTertiary: '#00363c',
  tertiaryContainer: '#52b2be',
  tertiaryBorder: '#4aa8b5', // tono oscuro del aqua claro (borde del botón)
  // Ámbar/dorado claro: 4º color de acción ("Mis logros") legible sobre índigo.
  quaternary: '#f5c26b',
  onQuaternary: '#3d2a00',
  quaternaryBorder: '#c99845', // tono oscuro del ámbar claro (borde del botón)
  // Texto lila claro sobre las superficies índigo (evita el blanco puro).
  onSurface: '#e2e0fc',
  onSurfaceVariant: '#dec0bb',
  outline: '#a58b86',
  // Error legible sobre oscuro.
  error: '#ffb4ab',
  onError: '#640c04',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  errorBorder: '#d1746b', // tono oscuro del rojo claro (borde del botón destructivo)
  // Color por valor de vocabulario (US-100): mismos tonos aclarados para legibilidad sobre
  // el índigo nocturno; texto oscuro encima de estos pasteles claros.
  category: {
    // Temas.
    animales: { color: '#7fce9f', on: '#111125' }, // verde
    aventuras: { color: '#76c3e1', on: '#111125' }, // azul cielo
    musica: { color: '#ffb4a7', on: '#111125' }, // coral (compartido con la categoría "Música")
    espacio: { color: '#a8b1f0', on: '#111125' }, // índigo claro
    magia: { color: '#d3bcfc', on: '#111125' }, // púrpura claro
    // Estilos.
    aventura: { color: '#bcd88a', on: '#111125' }, // oliva claro
    divertido: { color: '#f4a8c8', on: '#111125' }, // magenta claro
    educativo: { color: '#a0bce8', on: '#111125' }, // azul marino claro
    // Enseñanzas.
    amistad: { color: '#f0b088', on: '#111125' }, // naranja claro
    emociones: { color: '#e087a8', on: '#111125' }, // frambuesa claro
    valentia: { color: '#8fc4e0', on: '#111125' }, // azul acero claro
    honestidad: { color: '#b8d090', on: '#111125' }, // verde oliva claro
    // Categorías de actividad ("musica" comparte entrada con el tema).
    arte: { color: '#f0b878', on: '#111125' }, // ámbar claro
    logica: { color: '#76d5d5', on: '#111125' }, // teal claro
  },
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
