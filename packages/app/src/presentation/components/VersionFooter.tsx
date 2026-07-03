import * as Application from 'expo-application';
import { StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';

/**
 * Pie con la versión de la app: `v. <versión> (<build>)` y, **solo en desarrollo**,
 * el sufijo ` DEV` (en producción no se muestra el ambiente). La versión y el número
 * de build se leen del binario nativo (`expo-application`), así reflejan el build real
 * (EAS los inyecta). Se coloca al final de Welcome, Inicio y la zona de adultos.
 */
export function VersionFooter() {
  const styles = useThemedStyles(makeStyles);
  const version = Application.nativeApplicationVersion ?? '?';
  const build = Application.nativeBuildVersion ?? '?';
  const ambiente = __DEV__ ? ' DEV' : '';
  return (
    <Text style={styles.texto} accessibilityRole="text">
      {`v. ${version} (${build})${ambiente}`}
    </Text>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    texto: {
      ...typography.labelBold,
      fontSize: 13,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
  });
