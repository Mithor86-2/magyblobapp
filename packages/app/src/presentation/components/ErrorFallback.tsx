import { StyleSheet, Text, View } from 'react-native';
import { BubblyButton } from './BubblyButton';
import { colors, radius, spacing, typography } from '../theme/tokens';

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
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.emoji}>🌈</Text>
      <Text style={styles.title}>¡Vaya! Algo se ha despistado</Text>
      <Text style={styles.body}>No pasa nada. Vamos a intentarlo otra vez.</Text>
      <BubblyButton label="Reintentar" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
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
