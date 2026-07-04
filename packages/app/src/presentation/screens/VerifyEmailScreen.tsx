import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { CodeInput } from '../components/CodeInput';
import { useDialog } from '../components/DialogProvider';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { trackAction } from '../../infrastructure/telemetry';
import { useAppStore } from '../store/useAppStore';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';
import { CONSENT_VERSION } from './ConsentScreen';
import type { RootScreenProps } from '../navigation';

/** Longitud del código OTP (US-93); debe coincidir con el backend. */
const CODE_LENGTH = 6;

/** Cooldown de reenvío en segundos; alineado con el backend (`OTP_RESEND_COOLDOWN_MS`). */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Verificación de email por OTP (US-93). Tras el alta/login con SMTP configurado, el
 * adulto introduce el código de 6 dígitos recibido por correo; al validarlo, el
 * backend emite la sesión y se entra a la selección de perfil. Permite reenviar el
 * código (con cooldown) y muestra errores claros (incorrecto/caducado/agotado).
 */
export function VerifyEmailScreen({ navigation, route }: RootScreenProps<'VerifyEmail'>) {
  const { guardianId, email } = route.params;
  const { t } = useTranslation();
  const setSession = useAppStore((s) => s.setSession);
  const dialog = useDialog();
  const styles = useThemedStyles(makeStyles);

  const [codigo, setCodigo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cuenta atrás del cooldown de reenvío; se limpia al desmontar para no dejar
  // temporizadores colgando al navegar (evita fugas y avisos de estado tras unmount).
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const canSubmit = codigo.length === CODE_LENGTH && !submitting;

  async function onSubmit() {
    setSubmitting(true);
    trackAction('guardian.verifyEmail');
    try {
      const session = await api.guardians.verifyEmail(guardianId, codigo);
      setSession(session, CONSENT_VERSION);
      navigation.replace('SelectProfile');
    } catch (error) {
      const key =
        error instanceof ApiError && error.status === 429
          ? 'verify.errorTooMany'
          : 'verify.errorCode';
      dialog.alert({ title: t('common.ups'), message: t(key) });
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setResending(true);
    trackAction('guardian.resendVerification');
    try {
      await api.guardians.resendVerification(guardianId);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      dialog.alert({ title: t('common.ok'), message: t('verify.resentOk') });
    } catch {
      dialog.alert({ title: t('common.ups'), message: t('verify.errorResend') });
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen
      footer={
        <BubblyButton
          label={t('verify.submit')}
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={submitting}
        />
      }
    >
      <Text style={styles.title}>{t('verify.title')}</Text>
      <Text style={styles.body}>{t('verify.body', { email })}</Text>

      <Text style={styles.codeLabel}>{t('verify.codeLabel')}</Text>
      <CodeInput
        testID="verify-codigo"
        value={codigo}
        onChangeText={setCodigo}
        length={CODE_LENGTH}
        autoFocus
        accessibilityLabel={t('verify.codeLabel')}
      />

      <Pressable
        testID="verify-resend"
        style={styles.link}
        onPress={onResend}
        disabled={cooldown > 0 || resending}
        accessibilityRole="button"
        accessibilityLabel={t('verify.resend')}
      >
        <Text style={[styles.linkText, (cooldown > 0 || resending) && styles.linkDisabled]}>
          {cooldown > 0 ? t('verify.resendCooldown', { segundos: cooldown }) : t('verify.resend')}
        </Text>
      </Pressable>
    </Screen>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    title: {
      ...typography.displayLg,
      color: colors.primary,
    },
    body: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    codeLabel: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
    link: {
      marginTop: spacing.sm,
      alignSelf: 'center',
      paddingVertical: spacing.sm,
    },
    linkText: {
      ...typography.labelBold,
      color: colors.primary,
    },
    linkDisabled: {
      color: colors.onSurfaceVariant,
    },
  });
