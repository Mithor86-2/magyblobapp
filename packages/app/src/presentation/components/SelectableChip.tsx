import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, tapTarget, typography } from '../theme/tokens';

/** Color de categoría del chip seleccionado (US-89): un color por familia de opciones. */
export type ChipColor = 'primary' | 'secondary' | 'tertiary' | 'quaternary';

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Icono opcional delante de la etiqueta (US-89). */
  icon?: IconName;
  /** Color del chip seleccionado; por defecto coral (`primary`). Un color por categoría (US-89). */
  color?: ChipColor;
}

/** Fondo del chip seleccionado por color de categoría. */
const chipBg = (colors: ColorTokens): Record<ChipColor, string> => ({
  primary: colors.primary,
  secondary: colors.secondary,
  tertiary: colors.tertiary,
  quaternary: colors.quaternary,
});

/** Color del texto/icono del chip seleccionado (contrasta con su fondo). */
const chipFg = (colors: ColorTokens): Record<ChipColor, string> => ({
  primary: colors.onPrimary,
  secondary: colors.onSecondary,
  tertiary: colors.onTertiary,
  quaternary: colors.onQuaternary,
});

/**
 * Chip seleccionable (intereses, tema, estilo, idioma...). Activo = relleno del color de
 * su **categoría** (US-89, por defecto coral); inactivo = contorno suave. Puede llevar un
 * **icono** delante de la etiqueta. Tap target ≥64px de alto para dedos pequeños.
 */
export function SelectableChip({
  label,
  selected,
  onPress,
  icon,
  color = 'primary',
}: SelectableChipProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const bg = chipBg(colors)[color];
  const fg = chipFg(colors)[color];
  const iconColor = selected ? fg : colors.onSurfaceVariant;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      // Feedback táctil Material 3 (Android); en iOS/web el estado `pressed` atenúa el chip.
      android_ripple={{ color: bg + '33', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        selected ? { backgroundColor: bg, borderColor: bg } : styles.unselected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        {icon ? <Icon name={icon} size="sm" color={iconColor} /> : null}
        <Text style={[styles.label, { color: selected ? fg : colors.onSurfaceVariant }]}>
          {label}
        </Text>
      </View>
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
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pressed: {
      opacity: 0.85,
    },
    unselected: {
      backgroundColor: colors.surfaceContainer,
      borderColor: colors.outline,
    },
    label: {
      ...typography.labelBold,
    },
  });
