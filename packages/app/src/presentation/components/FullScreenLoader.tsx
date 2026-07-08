import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSlowHint } from '../hooks/useSlowHint';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';

interface FullScreenLoaderProps {
  /** Si el loader está visible (cubre la pantalla y bloquea la interacción). */
  visible: boolean;
  /** Mensaje que se muestra bajo el indicador (p. ej. "Creando un cuento mágico…"). */
  message: string;
}

/**
 * Loader **a pantalla completa** (US-102): un `Modal` que cubre toda la pantalla con un
 * indicador de progreso y un **mensaje**, bloqueando la interacción durante una espera
 * (generar cuento/actividad, crear cuenta/perfil). Si la espera se alarga, añade los avisos
 * de "tardando más de lo normal" (`useSlowHint`), como hacía el bloque inline anterior.
 */
export function FullScreenLoader({ visible, message }: FullScreenLoaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const lento = useSlowHint(visible);

  return (
    <Modal visible={visible} transparent animationType="fade" accessibilityViewIsModal>
      <View style={styles.backdrop} accessibilityRole="progressbar" accessibilityLabel={message}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
        {lento ? (
          <>
            <Text style={styles.hint}>{t('common.slowHint')}</Text>
            <Text style={styles.hint}>{t('common.slowHintServer')}</Text>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      // Cubre la pantalla con la superficie del tema (loader "de pantalla", no un scrim translúcido).
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.md,
    },
    message: {
      ...typography.bodyLg,
      color: colors.onSurface,
      textAlign: 'center',
    },
    hint: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });
