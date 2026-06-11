import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { TextField } from '../components/TextField';
import { PARENTESCOS } from '../api/types';
import type { Parentesco } from '../api/types';
import { PARENTESCO_LABEL } from '../labels';
import { ApiError, registerGuardian } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, typography } from '../theme/tokens';
import type { ScreenProps } from '../navigation';

/** Versión de los términos/política que el adulto acepta (se registra en el AuditLog). */
export const CONSENT_VERSION = '1.0';

/** Puerta parental: operación simple no resoluble por un niño de 2-6 años. */
const GATE_QUESTION = '7 + 6';
const GATE_OPTIONS = [12, 13, 15];
const GATE_ANSWER = 13;

export function ConsentScreen({ navigation }: ScreenProps<'Consent'>) {
  const setGuardian = useAppStore((s) => s.setGuardian);

  const [gatePassed, setGatePassed] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [parentesco, setParentesco] = useState<Parentesco | null>(null);
  const [aceptado, setAceptado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!gatePassed) {
    return (
      <Screen>
        <Text style={styles.title}>Zona de personas adultas</Text>
        <Text style={styles.body}>
          Para continuar, resuelve esta operación. Así nos aseguramos de que hay una persona adulta
          configurando la app.
        </Text>
        <Text style={styles.gateQuestion}>{GATE_QUESTION} = ?</Text>
        <View style={styles.gateOptions}>
          {GATE_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              label={String(option)}
              selected={false}
              onPress={() =>
                option === GATE_ANSWER
                  ? setGatePassed(true)
                  : Alert.alert('Casi', 'Esa no es. Inténtalo de nuevo.')
              }
            />
          ))}
        </View>
      </Screen>
    );
  }

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
      const guardian = await registerGuardian({
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        parentesco,
        consentimientoAceptado: true,
        consentimientoVersion: CONSENT_VERSION,
      });
      setGuardian(guardian.id, CONSENT_VERSION);
      navigation.replace('CreateProfile');
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : 'No se pudo completar el registro.';
      Alert.alert('Ups', mensaje);
    } finally {
      setSubmitting(false);
    }
  }

  return (
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

      <TextField label="Nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
      <TextField
        label="Apellidos"
        value={apellidos}
        onChangeText={setApellidos}
        autoCapitalize="words"
      />
      <TextField
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
          cuentos y actividades. Los datos no se comparten con terceros y el contenido se genera en
          local. (Versión {CONSENT_VERSION})
        </Text>
      </View>
    </Screen>
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
  gateQuestion: {
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  gateOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
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
