import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { colors, iconSize } from '../theme/tokens';

/**
 * Valoración en estrellas (1-3). En modo lectura solo muestra; si se pasa
 * `onChange`, cada estrella es pulsable (tap target generoso para dedos pequeños).
 */
export function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (valoracion: number) => void;
}) {
  const estrellas = [1, 2, 3];
  return (
    <View style={styles.row}>
      {estrellas.map((n) => {
        const lleno = n <= value;
        const star = (
          <Icon
            key={n}
            name="rating"
            size={iconSize.md}
            fill={lleno}
            color={lleno ? colors.primary : colors.outline}
          />
        );
        if (!onChange) return star;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} estrella${n > 1 ? 's' : ''}`}
            onPress={() => onChange(n)}
            style={styles.tap}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tap: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
