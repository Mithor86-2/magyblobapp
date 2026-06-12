import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { colors, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Entrada del onboarding: el adulto elige entre crear una cuenta nueva (alta +
 * consentimiento) o iniciar sesión si ya tiene una (login ligero por email, US-19).
 */
export function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.logo}>✨</Text>
        <Text style={styles.title}>Aprendizaje Mágico</Text>
        <Text style={styles.subtitle}>
          Cuentos y actividades personalizados para tus peques. Empieza creando tu cuenta o entra si
          ya tienes una.
        </Text>
      </View>

      <View style={styles.actions}>
        <BubblyButton label="Crear cuenta" onPress={() => navigation.navigate('Consent')} />
        <BubblyButton
          label="Ya tengo cuenta"
          onPress={() => navigation.navigate('Login')}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  logo: {
    fontSize: 80,
  },
  title: {
    ...typography.displayLg,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.elementGap,
    marginTop: spacing.lg,
  },
});
