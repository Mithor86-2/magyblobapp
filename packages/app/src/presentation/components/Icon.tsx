import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  Cloud,
  Compass,
  GraduationCap,
  Handshake,
  Home,
  Laugh,
  Library,
  MonitorSmartphone,
  Mountain,
  Music,
  Palette,
  Pause,
  PawPrint,
  Play,
  Puzzle,
  Rocket,
  Search,
  Shield,
  Smile,
  Sparkles,
  Square,
  Star,
  Tag,
  Trophy,
  UserRound,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { iconSize } from '../theme/tokens';

/**
 * Iconografía funcional de la app con `lucide-react-native` (SVG vectorial,
 * empaquetado en build-time: sin red en runtime ni SDK de tercero activo, US-29).
 *
 * Las pantallas piden el icono por **nombre semántico** del dominio de la UI y
 * quedan desacopladas de la librería: si mañana se cambia el set de iconos, solo
 * se toca este mapa. Los emojis de calidez (avatares de animales) **no** pasan
 * por aquí a propósito.
 */
const ICONS = {
  // Pestañas de navegación.
  home: Home,
  activities: Palette,
  story: BookOpen,
  library: Library,
  // Controles de narración (US-22).
  play: Play,
  pause: Pause,
  stop: Square,
  // Acciones / navegación.
  'arrow-right': ArrowRight,
  adults: UserRound,
  check: Check,
  search: Search,
  close: X,
  // Logros / trofeos ("Mis logros", US-94).
  achievements: Trophy,
  // Valoración (estrella; usar `fill` para el estado lleno).
  rating: Star,
  // Favorito (estrella; relleno cuando es favorito, US-64).
  favorite: Star,
  // Categorías de actividad.
  'cat-arte': Palette,
  'cat-musica': Music,
  'cat-logica': Puzzle,
  // Proveedor de IA "Autor" (US-25).
  'prov-mock': Sparkles,
  'prov-local': MonitorSmartphone,
  'prov-cloud': Cloud,
  // Iconos por categoría de los chips (US-89): un icono por opción de tema/estilo/enseñanza.
  'tema-animales': PawPrint,
  'tema-espacio': Rocket,
  'tema-magia': Wand2,
  'tema-aventuras': Compass,
  'tema-musica': Music,
  'estilo-aventura': Mountain,
  'estilo-divertido': Laugh,
  'estilo-educativo': GraduationCap,
  'ens-amistad': Handshake,
  'ens-emociones': Smile,
  'ens-valentia': Shield,
  'ens-honestidad': BadgeCheck,
  // Usar el nombre del niño como protagonista (US-76).
  name: Tag,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

type IconSizeToken = keyof typeof iconSize;

interface IconProps {
  name: IconName;
  /** Token de tamaño (`sm|md|lg`) o un número de píxeles. Por defecto `md`. */
  size?: IconSizeToken | number;
  /** Color del trazo (y del relleno si `fill`). Por defecto el texto sobre superficie. */
  color?: string;
  strokeWidth?: number;
  /** Rellena la silueta con `color` (p. ej. estrella de valoración "llena"). */
  fill?: boolean;
  accessibilityLabel?: string;
}

export function Icon({
  name,
  size = 'md',
  color,
  strokeWidth,
  fill = false,
  accessibilityLabel,
}: IconProps) {
  const { colors } = useTheme();
  const resolved = color ?? colors.onSurface;
  const Glyph = ICONS[name];
  const px = typeof size === 'number' ? size : iconSize[size];
  return (
    <Glyph
      size={px}
      color={resolved}
      strokeWidth={strokeWidth}
      fill={fill ? resolved : 'none'}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
