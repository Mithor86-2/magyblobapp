import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, type IconName } from './Icon';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, tapTarget, typography } from '../theme/tokens';

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
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'quaternary';
  /**
   * Disposición del contenido. `row` (por defecto): icono a la izquierda del texto (píldora).
   * `stack`: icono grande **encima** del texto (hasta 2 líneas), para servir de "tile" en una
   * rejilla de 2 columnas donde el texto no cabría en una sola línea junto al icono (US-94).
   */
  layout?: 'row' | 'stack';
}

/** Color de fondo por variante del botón, tomado de la paleta activa (US-66). */
const variantBg = (colors: ColorTokens) =>
  ({
    primary: colors.primary,
    secondary: colors.secondary,
    danger: colors.error,
    // Acento (cielo): acción afirmativa propia (p. ej. "Realizado" de una actividad, US-54,
    // o "Ya tengo cuenta", US-87), distinta de la secundaria menta.
    accent: colors.tertiary,
    // Cuaternario (ámbar): 4º color de acción ("Mis logros", US-87).
    quaternary: colors.quaternary,
  }) as const;

/**
 * Color del borde inferior ("sombra squishy") por variante: **un tono oscuro del propio
 * color del botón**, no el borde coral fijo de antes (US-87, ajuste #6).
 */
const variantBorder = (colors: ColorTokens) =>
  ({
    primary: colors.primaryBorder,
    secondary: colors.secondaryBorder,
    danger: colors.errorBorder,
    accent: colors.tertiaryBorder,
    quaternary: colors.quaternaryBorder,
  }) as const;

/** Color del texto/icono (primer plano) por variante, contrastando con su fondo (US-87). */
const variantFg = (colors: ColorTokens) =>
  ({
    primary: colors.onPrimary,
    secondary: colors.onSecondary,
    danger: colors.onError,
    accent: colors.onTertiary,
    quaternary: colors.onQuaternary,
  }) as const;

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
  layout = 'row',
}: BubblyButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const bg = variantBg(colors)[variant];
  const borderColor = variantBorder(colors)[variant];
  const fg = variantFg(colors)[variant];
  const isDisabled = disabled || loading;
  const isStack = layout === 'stack';

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
      android_ripple={{ color: fg + '33', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        isStack && styles.baseStack,
        // La "sombra" (borde inferior) es un tono oscuro del propio color del botón (US-87).
        { backgroundColor: bg, borderBottomColor: borderColor },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={[styles.inner, isStack && styles.innerStack]}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : icon ? (
          <Icon name={icon} color={fg} size={isStack ? 'lg' : 'md'} />
        ) : null}
        {label ? (
          <Text
            style={[styles.label, isStack && styles.labelStack, { color: fg }]}
            numberOfLines={isStack ? 2 : 1}
          >
            {label}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    base: {
      minHeight: tapTarget,
      borderRadius: radius.pill,
      borderBottomWidth: 4,
      justifyContent: 'center',
      paddingHorizontal: 24,
      // Recorta el android_ripple a la forma de píldora (sin esto desborda el radio).
      overflow: 'hidden',
    },
    // Tile de rejilla (US-94): más alto, esquinas de tarjeta (no píldora) y con aire vertical
    // para el icono grande sobre el texto; el ancho lo fija el contenedor (columna de la rejilla).
    baseStack: {
      minHeight: 108,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
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
    innerStack: {
      flexDirection: 'column',
      gap: spacing.sm,
    },
    label: {
      ...typography.button,
      color: colors.onPrimary,
      textAlign: 'center',
    },
    labelStack: {
      lineHeight: 26,
    },
  });
