import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';

/**
 * Barra de progreso simple y temática (US-68/A4): pinta una franja rellena según
 * `value/max` (acotado a 0..1). Sin dependencias de animación; el ancho del relleno
 * es un porcentaje. Accesible como `progressbar`.
 */
export function ProgressBar({
  value,
  max,
  height = 12,
}: {
  value: number;
  max: number;
  height?: number;
}) {
  const { colors } = useTheme();
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: value, min: 0, max }}
      style={[styles.track, { height, backgroundColor: colors.surfaceContainerHigh }]}
    >
      <View
        style={[styles.fill, { width: `${ratio * 100}%`, height, backgroundColor: colors.primary }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.pill,
  },
});
