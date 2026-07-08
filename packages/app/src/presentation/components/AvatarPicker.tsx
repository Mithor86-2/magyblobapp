import { Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, tapTarget } from '../theme/tokens';

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

/** Tamaño de cada avatar dentro de la celda del selector. */
const PICKER_AVATAR_SIZE = 44;

interface AvatarPickerProps {
  value: string | null;
  onChange: (id: string) => void;
}

/**
 * Selector de avatar: rejilla de imágenes; resalta el elegido. Emite el `id` del avatar.
 */
export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.grid}>
      {AVATARS.map((id) => {
        const selected = value === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={id}
            accessibilityState={{ selected }}
            onPress={() => onChange(id)}
            style={[styles.cell, selected ? styles.selected : styles.unselected]}
          >
            <AnimatedAvatar source={avatarSource(id)} size={PICKER_AVATAR_SIZE} />
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
      gap: 12,
    },
    cell: {
      width: tapTarget,
      height: tapTarget,
      borderRadius: radius.lg,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primary,
    },
    unselected: {
      backgroundColor: colors.surfaceContainer,
      borderColor: colors.outline,
    },
  });
