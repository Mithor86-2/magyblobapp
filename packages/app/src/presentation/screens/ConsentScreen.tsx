import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { TextField } from '../components/TextField';
import { ParentalGate } from '../components/ParentalGate';
import { useDialog } from '../components/DialogProvider';
import { PARENTESCOS } from '../../domain/types';
import type { Parentesco } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { PARENTESCO_LABEL } from '../labels';
import { api } from '../../composition';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/** Versión de los términos/política que el adulto acepta (se registra en el AuditLog). */
export const CONSENT_VERSION = '1.0';

export function ConsentScreen({ navigation }: RootScreenProps<'Consent'>) {
  const setSession = useAppStore((s) => s.setSession);
  const dialog = useDialog();

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [parentesco, setParentesco] = useState<Parentesco | null>(null);
  const [aceptado, setAceptado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    nombre.trim() !== '' &&
    apellidos.trim() !== '' &&
    email.trim() !== '' &&
    parentesco !== null &&
    aceptado &&
    !submitting;

  async function onSubmit() {
    if (!parentesco) return;
    setSubmitting(true);
    try {
      const session = await api.guardians.register({
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        parentesco,
        consentimientoAceptado: true,
        consentimientoVersion: CONSENT_VERSION,
      });
      setSession(session, CONSENT_VERSION);
      navigation.replace('SelectProfile');
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : 'No se pudo completar el registro.';
      dialog.alert({ title: 'Ups', message: mensaje });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ParentalGate intro="Para crear la cuenta, resuelve esta operación. Así nos aseguramos de que hay una persona adulta configurando la app.">
      <Screen
        footer={
          <BubblyButton
            label="Aceptar y continuar"
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={submitting}
          />
        }
      >
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.body}>
          Eres la persona responsable del menor. Necesitamos tus datos para asociar los perfiles y
          registrar tu consentimiento.
        </Text>

        <TextField
          testID="alta-nombre"
          label="Nombre"
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
        />
        <TextField
          testID="alta-apellidos"
          label="Apellidos"
          value={apellidos}
          onChangeText={setApellidos}
          autoCapitalize="words"
        />
        <TextField
          testID="alta-email"
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>Parentesco</Text>
        <View style={styles.chips}>
          {PARENTESCOS.map((p) => (
            <SelectableChip
              key={p}
              label={PARENTESCO_LABEL[p]}
              selected={parentesco === p}
              onPress={() => setParentesco(p)}
            />
          ))}
        </View>

        <View style={styles.consentBox}>
          <SelectableChip
            label={aceptado ? '✓ Acepto' : 'Acepto'}
            selected={aceptado}
            onPress={() => setAceptado((v) => !v)}
          />
          <Text style={styles.consentText}>
            Doy mi consentimiento para tratar los datos del menor con la única finalidad de generar
            cuentos y actividades. Los datos no se comparten con terceros y el contenido se genera
            en local. (Versión {CONSENT_VERSION})
          </Text>
        </View>
      </Screen>
    </ParentalGate>
  );
}

const styles = StyleSheet.create({
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
