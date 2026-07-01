import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BubblyButton } from './BubblyButton';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';

interface ErrorFallbackProps {
  /** Reintenta: el boundary se resetea y vuelve a montar el contenido. */
  onRetry: () => void;
}

/**
 * UI de respaldo cuando un boundary captura un error de render (US-41).
 *
 * Mensaje amable en español, pensado para una app infantil; **nunca** muestra el
 * `error.message` ni el _component stack_ (podrían contener PII del niño y son
 * ruido para el usuario, C-12). El detalle técnico va a Sentry, no a la pantalla.
 */
export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.emoji}>🌈</Text>
      <Text style={styles.title}>{t('errorFallback.title')}</Text>
      <Text style={styles.body}>{t('errorFallback.body')}</Text>
      <BubblyButton label={t('errorFallback.retry')} onPress={onRetry} />
    </View>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.containerPadding,
      backgroundColor: colors.errorContainer,
      borderRadius: radius.lg,
    },
    emoji: {
      fontSize: 64,
    },
    title: {
      ...typography.headlineMd,
      color: colors.onErrorContainer,
      textAlign: 'center',
    },
    body: {
      ...typography.bodyMd,
      color: colors.onErrorContainer,
      textAlign: 'center',
    },
  });
