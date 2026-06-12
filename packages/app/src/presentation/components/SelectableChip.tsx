import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, tapTarget, typography } from '../theme/tokens';

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Chip seleccionable (intereses, tema, estilo, idioma...). Activo = relleno
 * coral; inactivo = contorno suave. Tap target ≥64px de alto para dedos pequeños.
 */
export function SelectableChip({ label, selected, onPress }: SelectableChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.unselected]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: tapTarget,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unselected: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.outline,
  },
  label: {
    ...typography.labelBold,
  },
  labelSelected: {
    color: colors.onPrimary,
  },
  labelUnselected: {
    color: colors.onSurfaceVariant,
  },
});
