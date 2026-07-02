import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AdultsButton } from '../components/AdultsButton';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { ENSENANZAS, ESTILOS, TEMAS } from '../../domain/types';
import type { Ensenanza, Estilo, Tema } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { ensenanzaLabel, estiloLabel, temaLabel } from '../labels';
import { ensenanzaIcon, estiloIcon, temaIcon } from '../chipIcons';
import { avatarEmoji } from '../components/AvatarPicker';
import { api } from '../../composition';
import { useSlowHint } from '../hooks/useSlowHint';
import { trackAction } from '../../infrastructure/telemetry';
import { useAppStore } from '../store/useAppStore';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';
import type { RootStackParamList, TabScreenProps } from '../navigation';

/**
 * Pantalla del **generador de cuentos** para el perfil activo. Permite elegir uno o
 * varios temas y estilos (multi-selección, US-47/US-54) y una enseñanza opcional
 * (US-69), y lanza la generación contra el `api` inyectado. Al generar con éxito
 * **navega al lector** (`StoryReader` del stack raíz, A1/US-73), donde se lee el
 * cuento paginado; la pantalla se queda solo con el formulario. Degrada con un
 * mensaje si la petición falla.
 */
export function StoryGeneratorScreen({ navigation }: TabScreenProps<'Cuentos'>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const profile = useAppStore((s) => s.currentProfile);

  // Zona de adultos (A6): el botón fijo del header navega al stack raíz.
  const openParental = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Parental');

  // US-54: el generador ofrece TODOS los temas del vocabulario (antes se limitaba a
  // los intereses del perfil y ocultaba magia/música). Los intereses del perfil quedan
  // pre-seleccionados; el resto se puede añadir.
  const temasDisponibles: Tema[] = [...TEMAS];
  const interesesPerfil: Tema[] = profile?.intereses.length ? profile.intereses : ['magia'];

  // US-47: selección múltiple de temas y estilos (toggle por chip). Arranca con los
  // intereses del perfil preseleccionados para que "Generar" funcione sin tocar nada.
  const [temas, setTemas] = useState<Tema[]>(interesesPerfil);
  const [estilos, setEstilos] = useState<Estilo[]>(['aventura']);
  // US-69: enseñanza opcional de selección única (undefined = ninguna). Tocar el chip
  // ya elegido lo deselecciona.
  const [ensenanza, setEnsenanza] = useState<Ensenanza | undefined>(undefined);
  // US-76: usar el nombre del niño en el cuento (por defecto sí). Si se desactiva, el
  // backend genera con un protagonista genérico y no recibe el nombre.
  const [usarNombre, setUsarNombre] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Aviso de espera larga (US-53, cold-start de Render free).
  const lento = useSlowHint(loading);

  const puedeGenerar = temas.length > 0 && estilos.length > 0;

  function toggleTema(t: Tema) {
    setTemas((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function toggleEstilo(s: Estilo) {
    setEstilos((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function toggleEnsenanza(e: Ensenanza) {
    setEnsenanza((prev) => (prev === e ? undefined : e));
  }

  async function onGenerate() {
    if (!profile) return;
    if (!puedeGenerar) {
      setError(t('storyGenerator.needThemeStyle'));
      return;
    }
    setLoading(true);
    setError(null);
    trackAction('story.generate', {
      temas: temas.join(','),
      estilos: estilos.join(','),
      ensenanza: ensenanza ?? 'ninguna',
    });
    try {
      const result = await api.stories.generate({
        profileId: profile.id,
        temas,
        estilos,
        ensenanza,
        usarNombre,
      });
      // A1/US-73: al generar, se abre el lector (StoryReader del stack raíz) con el
      // cuento; el generador se queda solo con el formulario.
      navigation
        .getParent<NativeStackNavigationProp<RootStackParamList>>()
        ?.navigate('StoryReader', { story: result });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('storyGenerator.errorGenerate'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      headerImageName="cuentos"
      title={t('tabs.cuentos')}
      headerAction={<AdultsButton onPress={openParental} />}
      footer={
        <BubblyButton
          label={t('storyGenerator.generate')}
          onPress={onGenerate}
          loading={loading}
          disabled={!puedeGenerar}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.avatar}>{profile ? avatarEmoji(profile.avatar) : '🦊'}</Text>
        <Text style={styles.title}>
          {t('storyGenerator.title', {
            nombre: profile?.nombre ?? t('storyGenerator.youFallback'),
          })}
        </Text>
      </View>

      <Text style={styles.fieldLabel}>{t('storyGenerator.themes')}</Text>
      <View style={styles.chips}>
        {temasDisponibles.map((tema) => (
          <SelectableChip
            key={tema}
            label={temaLabel(tema)}
            selected={temas.includes(tema)}
            onPress={() => toggleTema(tema)}
            icon={temaIcon(tema)}
            color="tertiary"
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>{t('storyGenerator.styles')}</Text>
      <View style={styles.chips}>
        {ESTILOS.map((s) => (
          <SelectableChip
            key={s}
            label={estiloLabel(s)}
            selected={estilos.includes(s)}
            onPress={() => toggleEstilo(s)}
            icon={estiloIcon(s)}
            color="secondary"
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>{t('storyGenerator.teaching')}</Text>
      <Text style={styles.fieldHint}>{t('storyGenerator.teachingHint')}</Text>
      <View style={styles.chips}>
        {ENSENANZAS.map((e) => (
          <SelectableChip
            key={e}
            label={ensenanzaLabel(e)}
            selected={ensenanza === e}
            onPress={() => toggleEnsenanza(e)}
            icon={ensenanzaIcon(e)}
            color="quaternary"
          />
        ))}
      </View>

      {/* US-76: usar (o no) el nombre del niño como protagonista del cuento. */}
      <Text style={styles.fieldLabel}>{t('storyGenerator.nameField')}</Text>
      <View style={styles.chips}>
        <SelectableChip
          label={t('storyGenerator.useName', {
            nombre: profile?.nombre ?? t('storyGenerator.youFallback'),
          })}
          selected={usarNombre}
          onPress={() => setUsarNombre((v) => !v)}
          icon="name"
          color="primary"
        />
      </View>

      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>{t('storyGenerator.creating')}</Text>
          {lento ? (
            <>
              <Text style={styles.statusText}>{t('common.slowHint')}</Text>
              <Text style={styles.statusText}>{t('common.slowHintServer')}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <View style={[styles.statusBox, styles.errorBox]}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.statusText}>{t('storyGenerator.retryHint')}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    avatar: {
      fontSize: 56,
    },
    title: {
      ...typography.headlineMd,
      color: colors.primary,
      textAlign: 'center',
    },
    fieldLabel: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
    fieldHint: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    statusBox: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    statusText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    errorBox: {
      backgroundColor: colors.errorContainer,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
    },
    errorText: {
      ...typography.labelBold,
      color: colors.onErrorContainer,
      textAlign: 'center',
    },
  });
