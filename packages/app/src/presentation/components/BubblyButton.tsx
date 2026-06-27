import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, type IconName } from './Icon';
import { colors, radius, tapTarget, typography } from '../theme/tokens';

interface BubblyButtonProps {
  /** Texto del botón. Opcional para botones solo-icono (usar `accessibilityLabel`). */
  label?: string;
  /** Icono opcional delante del texto (lucide, vía wrapper `Icon`). */
  icon?: IconName;
  /** Nombre accesible cuando no hay `label` visible (botón solo-icono). */
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent';
}

const VARIANT_BG = {
  primary: colors.primary,
  secondary: colors.secondary,
  danger: colors.error,
  // Acento (cielo): acción afirmativa propia (p. ej. "Realizado" de una actividad, US-54),
  // distinta del color de la categoría y de la secundaria menta.
  accent: colors.tertiary,
} as const;

/**
 * Botón "squishy": píldora con borde inferior grueso (efecto 3D físico) que se
 * "hunde" al pulsar. Variante primaria coral, secundaria menta, accent cielo, danger
 * rojo (acciones destructivas como cerrar sesión). Tap target ≥64px.
 */
export function BubblyButton({
  label,
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: BubblyButtonProps) {
  const bg = VARIANT_BG[variant];
  const isDisabled = disabled || loading;

  // Confirmación táctil (Material 3 / HIG): háptico suave al pulsar el botón principal.
  // `impactAsync` es no-op en plataformas sin motor háptico (p. ej. web), así que degrada
  // de forma segura. No se espera la promesa: el efecto táctil no debe bloquear el onPress.
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={handlePress}
      disabled={isDisabled}
      // Ripple Material 3 en Android (centrado en el botón-píldora); el "hundido"
      // (translateY) sigue dando feedback en iOS/web vía el estado `pressed`.
      android_ripple={{ color: colors.onPrimary + '33', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderBottomColor: colors.primaryBorder },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : icon ? (
          <Icon name={icon} color={colors.onPrimary} size="md" />
        ) : null}
        {label ? (
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
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
    // Recorta el android_ripple a la forma de píldora (sin esto desborda el radio).
    overflow: 'hidden',
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
