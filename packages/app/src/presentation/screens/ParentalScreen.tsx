import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { ParentalGate } from '../components/ParentalGate';
import { useDialog } from '../components/DialogProvider';
import { useAppStore } from '../store/useAppStore';
import { isSentryEnabled } from '../../infrastructure/sentry';
import { IDIOMAS_APP } from '../../i18n';
import { idiomaLabel } from '../labels';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';
import type { ThemePreference } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/** Opciones de tema del selector (US-66): valor de preferencia + clave i18n de su etiqueta. */
const OPCIONES_TEMA: { value: ThemePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'parental.themeSystem' },
  { value: 'light', labelKey: 'parental.themeLight' },
  { value: 'dark', labelKey: 'parental.themeDark' },
];

/**
 * Zona de personas adultas (Fase 5.5, US-19): gestión de la sesión, separada de
 * la zona infantil y protegida por la puerta parental. Permite cambiar de perfil
 * activo y cerrar sesión. Las acciones de cuenta más completas (editar/eliminar)
 * llegan en fases posteriores (US-20/US-21).
 */
export function ParentalScreen({ navigation }: RootScreenProps<'Parental'>) {
  const { t } = useTranslation();
  const guardian = useAppStore((s) => s.guardian);
  const clearProfile = useAppStore((s) => s.clearProfile);
  const logout = useAppStore((s) => s.logout);
  const appLanguage = useAppStore((s) => s.appLanguage);
  const setAppLanguage = useAppStore((s) => s.setAppLanguage);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const styles = useThemedStyles(makeStyles);
  const dialog = useDialog();

  function onCambiarPerfil() {
    clearProfile();
    navigation.reset({ index: 0, routes: [{ name: 'SelectProfile' }] });
  }

  function onCerrarSesion() {
    dialog.confirm({
      title: t('parental.logoutConfirmTitle'),
      message: t('parental.logoutConfirmMessage'),
      confirmLabel: t('parental.logout'),
      destructive: true,
      onConfirm: () => {
        logout();
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      },
    });
  }

  // Disparador de prueba dev-only para verificar la tubería de Sentry de extremo a
  // extremo (US-40). Solo bajo `__DEV__`: nunca se renderiza en builds de producción.
  function onProbarSentry() {
    Sentry.captureException(
      new Error('Evento de prueba de Sentry (dev-only) desde ParentalScreen'),
    );
    dialog.alert({
      title: t('parental.sentryTitle'),
      message: isSentryEnabled() ? t('parental.sentrySent') : t('parental.sentryInactive'),
    });
  }

  return (
    <ParentalGate intro={t('parental.gateIntro')}>
      <Screen>
        {guardian ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('parental.account')}</Text>
            <Text style={styles.cardName}>
              {guardian.nombre} {guardian.apellidos}
            </Text>
            <Text style={styles.cardEmail}>{guardian.email}</Text>
          </View>
        ) : null}

        <Text style={styles.cardLabel}>{t('parental.language')}</Text>
        <View style={styles.chips}>
          {IDIOMAS_APP.map((code) => (
            <SelectableChip
              key={code}
              label={idiomaLabel(code)}
              selected={appLanguage === code}
              onPress={() => setAppLanguage(code)}
            />
          ))}
        </View>

        <Text style={styles.cardLabel}>{t('parental.theme')}</Text>
        <View style={styles.chips}>
          {OPCIONES_TEMA.map(({ value, labelKey }) => (
            <SelectableChip
              key={value}
              label={t(labelKey)}
              selected={themePreference === value}
              onPress={() => setThemePreference(value)}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <BubblyButton label={t('parental.changeProfile')} onPress={onCambiarPerfil} />
          <BubblyButton label={t('parental.logout')} onPress={onCerrarSesion} variant="secondary" />
          {__DEV__ ? (
            <BubblyButton
              label={t('parental.sentryTest')}
              onPress={onProbarSentry}
              variant="secondary"
            />
          ) : null}
        </View>
      </Screen>
    </ParentalGate>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      gap: spacing.xs,
      backgroundColor: colors.secondaryContainer,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    cardLabel: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
    cardName: {
      ...typography.headlineMd,
      color: colors.onSurface,
    },
    cardEmail: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actions: {
      gap: spacing.elementGap,
      marginTop: spacing.md,
    },
  });
