import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { TextField } from '../components/TextField';
import { ParentalGate } from '../components/ParentalGate';
import { useDialog } from '../components/DialogProvider';
import { PARENTESCOS, requiereVerificacion } from '../../domain/types';
import type { Parentesco } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { parentescoLabel } from '../labels';
import { api } from '../../composition';
import { useAppStore } from '../store/useAppStore';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/** Versión de los términos/política que el adulto acepta (se registra en el AuditLog). */
export const CONSENT_VERSION = '1.0';

/** Longitud mínima de la contraseña (US-48); debe coincidir con la validación del backend. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Regla de robustez de la contraseña (US-53): ≥8 caracteres con al menos una letra y
 * un número. Debe mantenerse sincronizada con el backend (`routes/guardians.ts`).
 */
export function passwordValida(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function ConsentScreen({ navigation }: RootScreenProps<'Consent'>) {
  const { t } = useTranslation();
  const setSession = useAppStore((s) => s.setSession);
  const dialog = useDialog();
  const styles = useThemedStyles(makeStyles);

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentesco, setParentesco] = useState<Parentesco | null>(null);
  const [aceptado, setAceptado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    nombre.trim() !== '' &&
    apellidos.trim() !== '' &&
    email.trim() !== '' &&
    passwordValida(password) &&
    parentesco !== null &&
    aceptado &&
    !submitting;

  async function onSubmit() {
    if (!parentesco) return;
    setSubmitting(true);
    try {
      const outcome = await api.guardians.register({
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        parentesco,
        password,
        consentimientoAceptado: true,
        consentimientoVersion: CONSENT_VERSION,
      });
      // US-93: si el backend exige verificar el email, va a la pantalla de OTP; si no
      // (sin SMTP), abre sesión y continúa como antes.
      if (requiereVerificacion(outcome)) {
        navigation.replace('VerifyEmail', {
          guardianId: outcome.guardianId,
          email: outcome.email,
        });
        return;
      }
      setSession(outcome, CONSENT_VERSION);
      navigation.replace('SelectProfile');
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : t('consent.errorGeneric');
      dialog.alert({ title: t('common.ups'), message: mensaje });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ParentalGate intro={t('consent.gateIntro')}>
      <Screen
        footer={
          <BubblyButton
            label={t('consent.submit')}
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={submitting}
          />
        }
      >
        <Text style={styles.title}>{t('consent.title')}</Text>
        <Text style={styles.body}>{t('consent.body')}</Text>

        <TextField
          testID="alta-nombre"
          label={t('consent.nombre')}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
        />
        <TextField
          testID="alta-apellidos"
          label={t('consent.apellidos')}
          value={apellidos}
          onChangeText={setApellidos}
          autoCapitalize="words"
        />
        <TextField
          testID="alta-email"
          label={t('common.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('common.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          testID="alta-password"
          label={t('common.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('consent.passwordPlaceholder')}
          autoCapitalize="none"
          secureTextEntry
        />
        <Text
          testID="alta-password-ayuda"
          style={[styles.passwordHint, passwordValida(password) && styles.passwordHintOk]}
        >
          {passwordValida(password) ? '✓ ' : ''}
          {t('consent.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        </Text>

        <Text style={styles.fieldLabel}>{t('consent.parentesco')}</Text>
        <View style={styles.chips}>
          {PARENTESCOS.map((p) => (
            <SelectableChip
              key={p}
              label={parentescoLabel(p)}
              selected={parentesco === p}
              onPress={() => setParentesco(p)}
            />
          ))}
        </View>

        <View style={styles.consentBox}>
          <SelectableChip
            label={aceptado ? `✓ ${t('consent.accept')}` : t('consent.accept')}
            selected={aceptado}
            onPress={() => setAceptado((v) => !v)}
          />
          <Text style={styles.consentText}>
            {t('consent.consentText', { version: CONSENT_VERSION })}
          </Text>
        </View>
      </Screen>
    </ParentalGate>
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
    fieldLabel: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
    passwordHint: {
      ...typography.bodyMd,
      fontSize: 14,
      lineHeight: 18,
      color: colors.onSurfaceVariant,
    },
    passwordHintOk: {
      color: colors.secondary,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    consentBox: {
      gap: spacing.sm,
      backgroundColor: colors.secondaryContainer,
      padding: spacing.md,
      borderRadius: 24,
    },
    consentText: {
      ...typography.bodyMd,
      color: colors.onSurface,
    },
  });
