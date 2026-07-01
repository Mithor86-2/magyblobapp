import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, tapTarget, typography } from '../theme/tokens';

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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      // Feedback táctil Material 3 (Android); en iOS/web el estado `pressed` atenúa el chip.
      android_ripple={{ color: colors.primary + '33', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    base: {
      minHeight: tapTarget,
      paddingHorizontal: 20,
      borderRadius: radius.pill,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      // Recorta el android_ripple a la forma de píldora.
      overflow: 'hidden',
    },
    pressed: {
      opacity: 0.85,
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
