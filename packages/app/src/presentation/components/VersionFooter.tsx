import * as Application from 'expo-application';
import { StyleSheet, Text } from 'react-native';
import { getBaseUrl } from '../../infrastructure/http';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';

/**
 * Pie con la versión de la app: `v. <versión> (<build>) · <backend>` y, **solo en
 * desarrollo**, el distintivo `DEV` (en producción no se muestra el ambiente). La versión
 * y el build se leen del binario nativo (`expo-application`, EAS los inyecta) y el backend
 * de `EXPO_PUBLIC_API_URL` vía `getBaseUrl()`: `Render` si apunta al servidor de producción,
 * `local` en cualquier otro caso. Se coloca al final de Welcome, Inicio y la zona de adultos.
 */
export function VersionFooter() {
  const styles = useThemedStyles(makeStyles);
  const version = Application.nativeApplicationVersion ?? '?';
  const build = Application.nativeBuildVersion ?? '?';
  const backend = getBaseUrl().includes('onrender.com') ? 'Render' : 'local';

  const partes = [`v. ${version} (${build})`];
  if (__DEV__) partes.push('DEV');
  partes.push(backend);

  return (
    <Text style={styles.texto} accessibilityRole="text">
      {partes.join(' · ')}
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
