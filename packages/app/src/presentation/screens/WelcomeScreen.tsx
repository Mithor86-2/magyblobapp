import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { VersionFooter } from '../components/VersionFooter';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Entrada del onboarding: el adulto elige entre crear una cuenta nueva (alta +
 * consentimiento) o iniciar sesión si ya tiene una (login ligero por email, US-19).
 */
export function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Screen headerImageName="welcome">
      <View style={styles.hero}>
        <Text style={styles.logo}>✨</Text>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
      </View>

      <View style={styles.actions}>
        <BubblyButton
          label={t('common.createAccount')}
          onPress={() => navigation.navigate('Consent')}
          variant="quaternary"
        />
        <BubblyButton
          label={t('common.haveAccount')}
          onPress={() => navigation.navigate('Login')}
          variant="accent"
        />
      </View>

      <VersionFooter />
    </Screen>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
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
