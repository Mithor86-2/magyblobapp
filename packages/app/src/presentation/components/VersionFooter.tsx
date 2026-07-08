import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { StyleSheet, Text } from 'react-native';
import { getBaseUrl } from '../../infrastructure/http';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';

/**
 * Pie con la versión de la app. La **versión** sale del config de la app
 * (`Constants.expoConfig.version` = `app.json` → la versión del release/código), la
 * **misma fuente que usa Sentry como `release`**, para que el número mostrado esté
 * **sincronizado con la versión publicada** (y no con el `expo-application` del binario
 * nativo, que se congela al compilar y se desincroniza tras un cambio de versión). El
 * `build` sí es el del binario (`expo-application`) y el backend sale de
 * `EXPO_PUBLIC_API_URL` vía `getBaseUrl()`. El formato depende del entorno:
 *
 * - **Desarrollo** (`__DEV__`): toda la info → `v. 1.16.0 (1) DEV · RENDER` (o `· LOCAL`).
 * - **Release apuntando a Render** (producción normal): solo `v. 1.16.0 (1)`.
 * - **Release que NO apunta a Render**: se marca `local` como aviso → `v. 1.16.0 (1) local`.
 *
 * Se coloca al final de Welcome, Inicio y la zona de adultos.
 */
/** ¿La URL apunta al servidor de producción (Render)? Compara por **host** (no por
 * subcadena: `.includes('onrender.com')` sería *bypasseable* por `onrender.com.evil`). */
function apuntaARender(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'onrender.com' || hostname.endsWith('.onrender.com');
  } catch {
    return false;
  }
}

export function VersionFooter() {
  const styles = useThemedStyles(makeStyles);
  // Versión del código/release (app.json vía expo-constants); respaldo al binario nativo.
  const version = Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? '?';
  const build = Application.nativeBuildVersion ?? '?';
  const onRender = apuntaARender(getBaseUrl());

  let texto = `v. ${version} (${build})`;
  if (__DEV__) {
    // Desarrollo: ambiente + backend (en mayúsculas).
    texto += ` DEV · ${onRender ? 'RENDER' : 'LOCAL'}`;
  } else if (!onRender) {
    // Release que no va a Render: se avisa con "local" (producción en Render no añade nada).
    texto += ' local';
  }

  return (
    <Text style={styles.texto} accessibilityRole="text">
      {texto}
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
