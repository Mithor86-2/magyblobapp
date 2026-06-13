import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, tapTarget, typography } from '../theme/tokens';

interface BubblyButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

const VARIANT_BG = {
  primary: colors.primary,
  secondary: colors.secondary,
  danger: colors.error,
} as const;

/**
 * Botón "squishy": píldora con borde inferior grueso (efecto 3D físico) que se
 * "hunde" al pulsar. Variante primaria coral, secundaria menta, danger rojo (acciones
 * destructivas como cerrar sesión). Tap target ≥64px.
 */
export function BubblyButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: BubblyButtonProps) {
  const bg = VARIANT_BG[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderBottomColor: colors.primaryBorder },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator color={colors.onPrimary} /> : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: tapTarget,
    borderRadius: radius.pill,
    borderBottomWidth: 4,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 3 }],
  },
  disabled: {
    opacity: 0.5,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    ...typography.button,
    color: colors.onPrimary,
    textAlign: 'center',
  },
});
