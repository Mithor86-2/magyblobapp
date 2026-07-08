import { useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing } from '../theme/tokens';

/**
 * Avatares predefinidos como **imágenes propias** empaquetadas en la app (sin descargas
 * en runtime, coherente con el cumplimiento para menores). El `id` ASCII es lo que se
 * guarda en el perfil; la imagen es solo presentación. Los `require` son **estáticos**
 * porque Metro no resuelve `require` dinámicos: solo se empaqueta lo referenciado
 * literalmente en `avatarImages`.
 */
const avatarImages: Record<string, ImageSourcePropType> = {
  zorro: require('../../../assets/images/avatars/zorro.png'),
  leon: require('../../../assets/images/avatars/leon.png'),
  tigre: require('../../../assets/images/avatars/tigre.png'),
  panda: require('../../../assets/images/avatars/panda.png'),
  koala: require('../../../assets/images/avatars/koala.png'),
  mono: require('../../../assets/images/avatars/mono.png'),
  conejo: require('../../../assets/images/avatars/conejo.png'),
  elefante: require('../../../assets/images/avatars/elefante.png'),
  jirafa: require('../../../assets/images/avatars/jirafa.png'),
  venado: require('../../../assets/images/avatars/venado.png'),
  pinguino: require('../../../assets/images/avatars/pinguino.png'),
  lechuza: require('../../../assets/images/avatars/lechuza.png'),
};

/** Avatar por defecto: se usa cuando un perfil guarda un `id` sin imagen (perfiles antiguos). */
const DEFAULT_AVATAR = 'zorro';

/** IDs de avatar seleccionables, en el orden en que se muestran en el selector. */
export const AVATARS: ReadonlyArray<string> = [
  'zorro',
  'leon',
  'tigre',
  'panda',
  'koala',
  'mono',
  'conejo',
  'elefante',
  'jirafa',
  'venado',
  'pinguino',
  'lechuza',
];

/**
 * Resuelve el `id` de avatar guardado en el perfil a su imagen empaquetada. Ante un `id`
 * desconocido (p. ej. un emoji antiguo como `gato`/`unicornio`) devuelve el avatar por
 * defecto, de modo que ningún perfil existente queda sin imagen.
 */
export function avatarSource(id: string): ImageSourcePropType {
  return avatarImages[id] ?? avatarImages[DEFAULT_AVATAR];
}

/** Columnas del selector: los 12 avatares se disponen en **3 filas de 4** (US-104). */
const COLUMNS = 4;
/** Separación entre celdas (horizontal y vertical). */
const GAP = spacing.sm;

interface AvatarPickerProps {
  value: string | null;
  onChange: (id: string) => void;
}

/**
 * Selector de avatar (US-104): rejilla de 4 columnas cuyas celdas **ocupan el ancho del
 * contenedor** (cada avatar es 1/4 del ancho, descontando los huecos). Cada avatar es
 * **redondo** (la celda recorta la imagen en círculo) y se muestra **sin fondo** —no hay
 * recuadro de color—; el avatar elegido se marca con un **anillo redondo** del color
 * primario. Emite el `id` del avatar.
 */
export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const styles = useThemedStyles(makeStyles);
  const { width: windowWidth } = useWindowDimensions();
  // Estimación inicial (ancho del contenido ≈ ventana − 2·containerPadding) para pintar ya
  // con el tamaño correcto; `onLayout` la corrige con el ancho real del grid.
  const [gridWidth, setGridWidth] = useState(windowWidth - spacing.containerPadding * 2);
  const onLayout = (e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width);

  // Cada celda ocupa 1/4 del ancho disponible, descontando los 3 huecos entre columnas.
  const cellSize = Math.max(0, Math.floor((gridWidth - GAP * (COLUMNS - 1)) / COLUMNS));

  return (
    <View style={styles.grid} onLayout={onLayout}>
      {AVATARS.map((id) => {
        const selected = value === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={id}
            accessibilityState={{ selected }}
            onPress={() => onChange(id)}
            style={[
              styles.cell,
              // Círculo: el radio es la mitad del lado (celda cuadrada), así se recorta la
              // imagen en redondo y el anillo de selección también es circular.
              { width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
              selected ? styles.selected : styles.unselected,
            ]}
          >
            <AnimatedAvatar source={avatarSource(id)} size={cellSize} />
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
    },
    // Sin fondo (US-104): la celda no pinta recuadro; la imagen (con transparencia) va sola,
    // recortada en círculo (`borderRadius` inline = lado/2 + `overflow: hidden`). El borde
    // reserva el hueco del anillo de selección para que no salte el layout al elegir.
    cell: {
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    selected: {
      borderColor: colors.primary,
    },
    unselected: {
      borderColor: 'transparent',
    },
  });
