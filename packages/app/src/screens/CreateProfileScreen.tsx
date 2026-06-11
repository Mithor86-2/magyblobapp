import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { TextField } from '../components/TextField';
import { AvatarPicker } from '../components/AvatarPicker';
import { IDIOMAS, TEMAS } from '../api/types';
import type { CodigoIdioma, Tema } from '../api/types';
import { IDIOMA_LABEL, TEMA_LABEL } from '../labels';
import { ApiError, createProfile } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, typography } from '../theme/tokens';
import type { ScreenProps } from '../navigation';

const EDADES = [2, 3, 4, 5, 6] as const;

export function CreateProfileScreen({ navigation }: ScreenProps<'CreateProfile'>) {
  const guardianId = useAppStore((s) => s.guardianId);
  const setProfile = useAppStore((s) => s.setProfile);

  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState<number | null>(null);
  const [idioma, setIdioma] = useState<CodigoIdioma>('es');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [intereses, setIntereses] = useState<Tema[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleInteres(tema: Tema) {
    setIntereses((prev) =>
      prev.includes(tema) ? prev.filter((t) => t !== tema) : [...prev, tema],
    );
  }

  const canSubmit =
    nombre.trim() !== '' &&
    edad !== null &&
    avatar !== null &&
    intereses.length > 0 &&
    guardianId !== null &&
    !submitting;

  async function onSubmit() {
    if (edad === null || avatar === null || guardianId === null) return;
    setSubmitting(true);
    try {
      const profile = await createProfile({
        guardianId,
        nombre: nombre.trim(),
        edad,
        idioma,
        avatar,
        intereses,
      });
      setProfile(profile);
      navigation.navigate('StoryGenerator');
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo crear el perfil.';
      Alert.alert('Ups', mensaje);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      footer={
        <BubblyButton
          label="¡Listo!"
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={submitting}
        />
      }
    >
      <Text style={styles.title}>Crear perfil</Text>

      <TextField
        label="¿Cómo te llamas?"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Tu nombre"
        autoCapitalize="words"
      />

      <Text style={styles.fieldLabel}>¿Cuántos años tienes?</Text>
      <View style={styles.chips}>
        {EDADES.map((e) => (
          <SelectableChip
            key={e}
            label={String(e)}
            selected={edad === e}
            onPress={() => setEdad(e)}
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>Idioma</Text>
      <View style={styles.chips}>
        {IDIOMAS.map((code) => (
          <SelectableChip
            key={code}
            label={IDIOMA_LABEL[code]}
            selected={idioma === code}
            onPress={() => setIdioma(code)}
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>Elige tu avatar</Text>
      <AvatarPicker value={avatar} onChange={setAvatar} />

      <Text style={styles.fieldLabel}>¿Qué te gusta?</Text>
      <View style={styles.chips}>
        {TEMAS.map((tema) => (
          <SelectableChip
            key={tema}
            label={TEMA_LABEL[tema]}
            selected={intereses.includes(tema)}
            onPress={() => toggleInteres(tema)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.displayLg,
    color: colors.primary,
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
});
