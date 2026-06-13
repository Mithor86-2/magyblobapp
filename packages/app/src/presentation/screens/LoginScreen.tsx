import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { TextField } from '../components/TextField';
import { useDialog } from '../components/DialogProvider';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, typography } from '../theme/tokens';
import { CONSENT_VERSION } from './ConsentScreen';
import type { RootScreenProps } from '../navigation';

/**
 * Inicio de sesión del adulto (US-19): identificación ligera por email, sin
 * contraseña (la autenticación robusta queda fuera del alcance del TFM). Si el
 * email existe, recupera la cuenta y lleva a la selección de perfil.
 */
export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const setGuardian = useAppStore((s) => s.setGuardian);
  const dialog = useDialog();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim() !== '' && !submitting;

  const irACrearCuenta = () => navigation.replace('Consent');

  async function onSubmit() {
    setSubmitting(true);
    try {
      const guardian = await api.guardians.login({ email: email.trim() });
      setGuardian(guardian, CONSENT_VERSION);
      navigation.replace('SelectProfile');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // Sin cuenta con ese email: ofrece ir directo al alta (no dejar sin salida).
        dialog.confirm({
          title: 'No encontramos esa cuenta',
          message: 'No hay ninguna cuenta con ese email. ¿Quieres crear una?',
          confirmLabel: 'Crear cuenta',
          cancelLabel: 'Reintentar',
          onConfirm: irACrearCuenta,
        });
      } else {
        const mensaje = error instanceof ApiError ? error.message : 'No se pudo iniciar sesión.';
        dialog.alert({ title: 'Ups', message: mensaje });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      footer={
        <BubblyButton
          label="Entrar"
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={submitting}
        />
      }
    >
      <Text style={styles.body}>
        Escribe el email con el que creaste tu cuenta. Te llevaremos a tus perfiles.
      </Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Pressable
        style={styles.link}
        onPress={irACrearCuenta}
        accessibilityRole="button"
        accessibilityLabel="Crear una cuenta"
      >
        <Text style={styles.linkText}>¿No tienes cuenta? Crear una</Text>
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
