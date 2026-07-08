import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';
import type { Tema } from '../../domain/types';

/**
 * Catálogo de portadas empaquetadas por **nombre de fichero** (US-101). El backend elige
 * de la config `story.covers` el nombre que aplica al cuento (`portadaKey`) y aquí se
 * resuelve contra la imagen bundleada. Usa `require` **estáticos** (Metro solo empaqueta lo
 * referenciado literalmente), así que **añadir** una portada nueva exige una entrada aquí
 * además de la config de BD. Incluye variantes por tema y por tema+estilo.
 */
const coversByName: Record<string, ImageSourcePropType> = {
  'animales.png': require('../../../assets/images/story/animales.png'),
  'animales+aventura.png': require('../../../assets/images/story/animales+aventura.png'),
  'animales+divertido.png': require('../../../assets/images/story/animales+divertido.png'),
  'espacio.png': require('../../../assets/images/story/espacio.png'),
  'espacio+aventura.png': require('../../../assets/images/story/espacio+aventura.png'),
  'espacio+divertido.png': require('../../../assets/images/story/espacio+divertido.png'),
  'magia.png': require('../../../assets/images/story/magia.png'),
  'magia+divertido.png': require('../../../assets/images/story/magia+divertido.png'),
  'musica.png': require('../../../assets/images/story/musica.png'),
  'musica+aventura.png': require('../../../assets/images/story/musica+aventura.png'),
  'musica+divertido.png': require('../../../assets/images/story/musica+divertido.png'),
  'aventuras.png': require('../../../assets/images/story/aventuras.png'),
  'aventura.png': require('../../../assets/images/story/aventura.png'),
  'divertido.png': require('../../../assets/images/story/divertido.png'),
};

/**
 * Respaldo local por **tema** (US-59): última red de seguridad cuando no hay ni portada
 * generada ni `portadaKey` válido. Reutiliza las entradas del catálogo por nombre.
 */
const respaldoPorTema: Record<Tema, ImageSourcePropType> = {
  animales: coversByName['animales.png']!,
  espacio: coversByName['espacio.png']!,
  magia: coversByName['magia.png']!,
  aventuras: coversByName['aventuras.png']!,
  musica: coversByName['musica.png']!,
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
 * Resuelve la fuente de imagen a pintar por prioridad (US-59/US-101): (1) imagen
 * **generada** (data URL) si existe; (2) la portada empaquetada elegida por el backend
 * (`portadaKey`) si está en el catálogo; (3) el **respaldo local por tema** (o el neutro).
 * Exportada para tests.
 */
export function portadaSource(
  generada: string | undefined,
  tema: string,
  portadaKey?: string,
): ImageSourcePropType {
  if (generada !== undefined && generada !== '') return { uri: generada };
  if (portadaKey !== undefined && coversByName[portadaKey]) return coversByName[portadaKey]!;
  return respaldoPorTema[tema as Tema] ?? RESPALDO_DEFECTO;
}

/** Resuelve el tema de respaldo para una actividad a partir de su categoría. */
export function temaDeCategoria(categoria: string): Tema {
  return TEMA_POR_CATEGORIA[categoria] ?? 'aventuras';
}

interface StoryCoverProps {
  /** Data URL de la imagen generada (si existe); si no, se usa `portadaKey`/respaldo por tema. */
  generada?: string;
  /** Nombre de la portada empaquetada elegida por el backend (US-101); prioritaria sobre el tema. */
  portadaKey?: string;
  /** Tema (cuento) o tema equivalente (actividad) que elige el respaldo local. */
  tema: string;
  /** Estilo opcional del `Image` (alto, bordes…). */
  style?: StyleProp<ImageStyle>;
  /** Texto alternativo accesible. */
  accessibilityLabel?: string;
}

/** Componente de portada: imagen generada, portada empaquetada (`portadaKey`) o respaldo local. */
export function StoryCover({
  generada,
  portadaKey,
  tema,
  style,
  accessibilityLabel,
}: StoryCoverProps) {
  return (
    <Image
      source={portadaSource(generada, tema, portadaKey)}
      style={style}
      resizeMode="cover"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
