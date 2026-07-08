import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useSlowHint } from '../hooks/useSlowHint';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography, withAlpha } from '../theme/tokens';

interface FullScreenLoaderProps {
  /** Si el loader está visible (cubre la pantalla y bloquea la interacción). */
  visible: boolean;
  /** Mensaje que se muestra bajo el indicador (p. ej. "Creando un cuento mágico…"). */
  message: string;
  /**
   * Emoji del avatar del perfil (US): si se pasa, se muestra sobre el indicador para dar
   * calidez y contexto (de quién es lo que se está generando/creando). Ausente en flujos
   * sin perfil (p. ej. crear cuenta).
   */
  avatar?: string;
}

/**
 * Loader **a pantalla completa** (US-102): un `Modal` que cubre toda la pantalla con un
 * indicador de progreso y un **mensaje**, bloqueando la interacción durante una espera
 * (generar cuento/actividad, crear cuenta/perfil). Si la espera se alarga, añade los avisos
 * de "tardando más de lo normal" (`useSlowHint`), como hacía el bloque inline anterior.
 */
export function FullScreenLoader({ visible, message, avatar }: FullScreenLoaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const lento = useSlowHint(visible);

  return (
    <Modal visible={visible} transparent animationType="fade" accessibilityViewIsModal>
      <View style={styles.backdrop} accessibilityRole="progressbar" accessibilityLabel={message}>
        {avatar ? <AnimatedAvatar emoji={avatar} style={styles.avatar} /> : null}
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
      // Superficie del tema con algo de transparencia (US-102): deja entrever la pantalla
      // detrás sin perder legibilidad del indicador y el texto (opacos por encima).
      backgroundColor: withAlpha(colors.surface, 0.88),
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.md,
    },
    avatar: {
      fontSize: 72,
      textAlign: 'center',
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
