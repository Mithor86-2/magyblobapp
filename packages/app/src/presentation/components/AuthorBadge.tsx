import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ProveedorIa } from '../../domain/types';
import { proveedorLabel } from '../labels';
import { Icon } from './Icon';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';

/**
 * "Autor": muestra qué proveedor de IA generó realmente el contenido (US-25),
 * con un icono por proveedor (mock | local | cloud). Se usa al final del cuento
 * y de cada actividad, y en el Historial.
 */
export function AuthorBadge({ proveedor }: { proveedor: ProveedorIa }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const texto = t('authorBadge.author', { proveedor: proveedorLabel(proveedor) });
  return (
    <View style={styles.row} accessibilityLabel={texto}>
      <Icon name={`prov-${proveedor}`} size="sm" color={colors.onSurfaceVariant} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    texto: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
  });
