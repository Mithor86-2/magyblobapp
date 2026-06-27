import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { ESTILOS, TEMAS } from '../../domain/types';
import type { Estilo, Story, Tema } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { ESTILO_LABEL, TEMA_LABEL } from '../labels';
import { avatarEmoji } from '../components/AvatarPicker';
import { AuthorBadge } from '../components/AuthorBadge';
import { NarrationControls } from '../components/NarrationControls';
import { api } from '../../composition';
import { trackAction } from '../../infrastructure/telemetry';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';
import type { TabScreenProps } from '../navigation';

export function StoryGeneratorScreen(_props: TabScreenProps<'Cuentos'>) {
  const profile = useAppStore((s) => s.currentProfile);

  // US-54: el generador ofrece TODOS los temas del vocabulario (antes se limitaba a
  // los intereses del perfil y ocultaba magia/música). Los intereses del perfil quedan
  // pre-seleccionados; el resto se puede añadir.
  const temasDisponibles: Tema[] = [...TEMAS];
  const interesesPerfil: Tema[] = profile?.intereses.length ? profile.intereses : ['magia'];

  // US-47: selección múltiple de temas y estilos (toggle por chip). Arranca con los
  // intereses del perfil preseleccionados para que "Generar" funcione sin tocar nada.
  const [temas, setTemas] = useState<Tema[]>(interesesPerfil);
  const [estilos, setEstilos] = useState<Estilo[]>(['aventura']);
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);

  const puedeGenerar = temas.length > 0 && estilos.length > 0;

  function toggleTema(t: Tema) {
    setTemas((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function toggleEstilo(s: Estilo) {
    setEstilos((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function onGenerate() {
    if (!profile) return;
    if (!puedeGenerar) {
      setError('Elige al menos un tema y un estilo.');
      return;
    }
    setLoading(true);
    setError(null);
    setStory(null);
    trackAction('story.generate', { temas: temas.join(','), estilos: estilos.join(',') });
    try {
      const result = await api.stories.generate({ profileId: profile.id, temas, estilos });
      setStory(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo generar el cuento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      headerImageName="cuentos"
      footer={
        <BubblyButton
          label={story ? 'Generar otro' : 'Generar cuento'}
          onPress={onGenerate}
          loading={loading}
          disabled={!puedeGenerar}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.avatar}>{profile ? avatarEmoji(profile.avatar) : '🦊'}</Text>
        <Text style={styles.title}>Un cuento para {profile?.nombre ?? 'ti'}</Text>
      </View>

      <Text style={styles.fieldLabel}>Temas</Text>
      <View style={styles.chips}>
        {temasDisponibles.map((t) => (
          <SelectableChip
            key={t}
            label={TEMA_LABEL[t]}
            selected={temas.includes(t)}
            onPress={() => toggleTema(t)}
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>Estilos</Text>
      <View style={styles.chips}>
        {ESTILOS.map((s) => (
          <SelectableChip
            key={s}
            label={ESTILO_LABEL[s]}
            selected={estilos.includes(s)}
            onPress={() => toggleEstilo(s)}
          />
        ))}
      </View>

      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>Creando un cuento mágico…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.statusBox, styles.errorBox]}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.statusText}>Toca «Generar cuento» para reintentar.</Text>
        </View>
      ) : null}

      {story ? (
        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>{story.titulo}</Text>
          <Text style={styles.storyBody}>{story.cuerpo}</Text>
          <NarrationControls story={story} />
          <AuthorBadge proveedor={story.proveedor} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  storyCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...softShadow,
  },
  storyTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  storyBody: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
});
