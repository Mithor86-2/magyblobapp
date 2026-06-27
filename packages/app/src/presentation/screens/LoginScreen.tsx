import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { TextField } from '../components/TextField';
import { useDialog } from '../components/DialogProvider';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { trackAction } from '../../infrastructure/telemetry';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, typography } from '../theme/tokens';
import { CONSENT_VERSION } from './ConsentScreen';
import type { RootScreenProps } from '../navigation';

/**
 * Inicio de sesión del adulto (US-48): verifica **email + contraseña** contra el
 * backend (revierte el login ligero por email de US-19). Si las credenciales son
 * correctas, recupera la cuenta y lleva a la selección de perfil. Ante credenciales
 * inválidas el backend responde un 401 **genérico** que no distingue entre email
 * inexistente y contraseña errónea; la UI muestra el mismo mensaje genérico.
 */
export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const { t } = useTranslation();
  const setSession = useAppStore((s) => s.setSession);
  const dialog = useDialog();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim() !== '' && password !== '' && !submitting;

  const irACrearCuenta = () => navigation.replace('Consent');

  async function onSubmit() {
    setSubmitting(true);
    trackAction('guardian.login');
    try {
      const session = await api.guardians.login({ email: email.trim(), password });
      setSession(session, CONSENT_VERSION);
      navigation.replace('SelectProfile');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Credencial inválida: mensaje genérico (no revela si el email existe).
        dialog.alert({
          title: t('login.failTitle'),
          message: t('login.failMessage'),
        });
      } else {
        const mensaje = error instanceof ApiError ? error.message : t('login.errorGeneric');
        dialog.alert({ title: t('common.ups'), message: mensaje });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      footer={
        <BubblyButton
          label={t('login.submit')}
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={submitting}
        />
      }
    >
      <Text style={styles.body}>{t('login.body')}</Text>

      <TextField
        testID="login-email"
        label={t('common.email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('common.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        testID="login-password"
        label={t('common.password')}
        value={password}
        onChangeText={setPassword}
        placeholder={t('login.passwordPlaceholder')}
        autoCapitalize="none"
        secureTextEntry
      />

      <Pressable
        style={styles.link}
        onPress={irACrearCuenta}
        accessibilityRole="button"
        accessibilityLabel={t('login.createAccountA11y')}
      >
        <Text style={styles.linkText}>{t('login.noAccount')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    ...typography.bodyMd,
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
});
