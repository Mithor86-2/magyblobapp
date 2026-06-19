import { StyleSheet, Text, View } from 'react-native';
import type { ProveedorIa } from '../../domain/types';
import { PROVEEDOR_LABEL } from '../labels';
import { Icon } from './Icon';
import { colors, spacing, typography } from '../theme/tokens';

/**
 * "Autor": muestra qué proveedor de IA generó realmente el contenido (US-25),
 * con un icono por proveedor (mock | local | cloud). Se usa al final del cuento
 * y de cada actividad, y en el Historial.
 */
export function AuthorBadge({ proveedor }: { proveedor: ProveedorIa }) {
  return (
    <View style={styles.row} accessibilityLabel={`Autor: ${PROVEEDOR_LABEL[proveedor]}`}>
      <Icon name={`prov-${proveedor}`} size="sm" color={colors.onSurfaceVariant} />
      <Text style={styles.texto}>Autor: {PROVEEDOR_LABEL[proveedor]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
