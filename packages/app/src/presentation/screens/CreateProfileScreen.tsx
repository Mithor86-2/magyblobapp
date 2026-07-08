import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { SelectableChip } from '../components/SelectableChip';
import { TextField } from '../components/TextField';
import { AvatarPicker } from '../components/AvatarPicker';
import { useDialog } from '../components/DialogProvider';
import { IDIOMAS, TEMAS } from '../../domain/types';
import type { CodigoIdioma, Tema } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { idiomaLabel, temaLabel } from '../labels';
import { temaIcon } from '../chipIcons';
import { vocabColor } from '../vocabColor';
import { api } from '../../composition';
import { trackAction } from '../../infrastructure/telemetry';
import { useAppStore } from '../store/useAppStore';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

const EDADES = [2, 3, 4, 5, 6] as const;

/**
 * Pantalla de **alta de perfil de niño** bajo la cuenta del adulto: nombre, edad,
 * idioma e intereses (vocabulario cerrado de temas). Valida en cliente, crea el
 * perfil contra el `api` inyectado y lo deja como perfil activo. US-01.
 */
export function CreateProfileScreen({ navigation }: RootScreenProps<'CreateProfile'>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const guardianId = useAppStore((s) => s.guardian?.id ?? null);
  const setProfile = useAppStore((s) => s.setProfile);
  const dialog = useDialog();

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
    // Solo enums/contadores; nunca el nombre del niño (PII).
    trackAction('profile.create', { edad, idioma, intereses: intereses.length });
    try {
      const profile = await api.profiles.create({
        guardianId,
        nombre: nombre.trim(),
        edad,
        idioma,
        avatar,
        intereses,
      });
      setProfile(profile);
      navigation.navigate('Main');
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : t('createProfile.errorGeneric');
      dialog.alert({ title: t('common.ups'), message: mensaje });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      footer={
        <BubblyButton
          label={t('createProfile.submit')}
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={submitting}
        />
      }
    >
      {/* US-102: loader a pantalla completa mientras se crea el perfil, con el avatar elegido. */}
      <FullScreenLoader
        visible={submitting}
        message={t('createProfile.creating')}
        avatarId={avatar ?? undefined}
      />
      <TextField
        label={t('createProfile.name')}
        value={nombre}
        onChangeText={setNombre}
        placeholder={t('createProfile.namePlaceholder')}
        autoCapitalize="words"
      />

      <Text style={styles.fieldLabel}>{t('createProfile.age')}</Text>
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

      <Text style={styles.fieldLabel}>{t('createProfile.language')}</Text>
      <View style={styles.chips}>
        {IDIOMAS.map((code) => (
          <SelectableChip
            key={code}
            label={idiomaLabel(code)}
            selected={idioma === code}
            onPress={() => setIdioma(code)}
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>{t('createProfile.avatar')}</Text>
      <AvatarPicker value={avatar} onChange={setAvatar} />

      <Text style={styles.fieldLabel}>{t('createProfile.interests')}</Text>
      <View style={styles.chips}>
        {TEMAS.map((tema) => (
          <SelectableChip
            key={tema}
            label={temaLabel(tema)}
            selected={intereses.includes(tema)}
            onPress={() => toggleInteres(tema)}
            icon={temaIcon(tema)}
            tint={vocabColor(colors, tema)}
          />
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
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
