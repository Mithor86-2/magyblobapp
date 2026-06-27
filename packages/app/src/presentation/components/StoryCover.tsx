import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';
import type { Tema } from '../../domain/types';

/**
 * Portada ilustrada de un cuento/actividad (US-59). La app **siempre** muestra una
 * portada con cero latencia: prefiere la imagen **generada** (`portada`/`imagen`,
 * una data URL del backend) si existe, y si no cae al **respaldo local empaquetado**
 * elegido por **tema**.
 *
 * El mapa tema → imagen usa `require` **estáticos** (Metro no resuelve `require`
 * dinámicos: solo empaqueta lo referenciado literalmente), igual que las cabeceras
 * de F6 (`Screen.headerImageName`). Si el tema no está en el mapa, se usa `aventuras`
 * como respaldo neutro (`default`).
 */
const respaldoPorTema: Record<Tema, ImageSourcePropType> = {
  animales: require('../../../assets/images/story/animales.png'),
  espacio: require('../../../assets/images/story/espacio.png'),
  magia: require('../../../assets/images/story/magia.png'),
  aventuras: require('../../../assets/images/story/aventuras.png'),
  musica: require('../../../assets/images/story/musica.png'),
};

/** Respaldo neutro cuando el tema no está en el mapa (US-59). */
const RESPALDO_DEFECTO: ImageSourcePropType = respaldoPorTema.aventuras;

/** Mapa de equivalencia categoría de actividad → tema con respaldo ilustrado. */
const TEMA_POR_CATEGORIA: Record<string, Tema> = {
  arte: 'magia',
  musica: 'musica',
  logica: 'espacio',
};

/**
 * Resuelve la fuente de imagen a pintar: la generada (data URL) si existe; si no,
 * el respaldo local por tema (o el respaldo neutro). Exportada para tests del
 * fallback de selección por tema.
 */
export function portadaSource(generada: string | undefined, tema: string): ImageSourcePropType {
  if (generada !== undefined && generada !== '') return { uri: generada };
  return respaldoPorTema[tema as Tema] ?? RESPALDO_DEFECTO;
}

/** Resuelve el tema de respaldo para una actividad a partir de su categoría. */
export function temaDeCategoria(categoria: string): Tema {
  return TEMA_POR_CATEGORIA[categoria] ?? 'aventuras';
}

interface StoryCoverProps {
  /** Data URL de la imagen generada (si existe); si no, se usa el respaldo por tema. */
  generada?: string;
  /** Tema (cuento) o tema equivalente (actividad) que elige el respaldo local. */
  tema: string;
  /** Estilo opcional del `Image` (alto, bordes…). */
  style?: StyleProp<ImageStyle>;
  /** Texto alternativo accesible. */
  accessibilityLabel?: string;
}

/** Componente de portada: imagen generada o respaldo local, sin latencia. */
export function StoryCover({ generada, tema, style, accessibilityLabel }: StoryCoverProps) {
  return (
    <Image
      source={portadaSource(generada, tema)}
      style={style}
      resizeMode="cover"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
