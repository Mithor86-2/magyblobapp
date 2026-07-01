import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';

/**
 * Botón fijo de acceso a la **zona de adultos** (A6), pensado para el `headerAction`
 * del componente `Screen`: se pinta arriba a la derecha, persistente en las pestañas.
 * Navega mediante el `onPress` que le pasa la pantalla (que ya conoce su navegación);
 * el destino (`Parental`) tiene su propia puerta parental.
 */
export function AdultsButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('home.adultsZone')}
      hitSlop={8}
      style={[styles.button, { backgroundColor: colors.surfaceContainerHigh }]}
    >
      <Icon name="adults" size="md" color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.sm,
    borderRadius: radius.pill,
  },
});
