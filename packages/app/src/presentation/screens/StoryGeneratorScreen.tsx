import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { ESTILOS } from '../../domain/types';
import type { Estilo, Story, Tema } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { ESTILO_LABEL, TEMA_LABEL } from '../labels';
import { avatarEmoji } from '../components/AvatarPicker';
import { AuthorBadge } from '../components/AuthorBadge';
import { NarrationControls } from '../components/NarrationControls';
import { api } from '../../composition';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';
import type { TabScreenProps } from '../navigation';

export function StoryGeneratorScreen(_props: TabScreenProps<'Cuentos'>) {
  const profile = useAppStore((s) => s.currentProfile);

  // El perfil siempre existe al llegar aquí (se navega tras crearlo); guarda defensiva.
  const temasDisponibles: Tema[] = profile?.intereses.length ? profile.intereses : ['magia'];

  const [tema, setTema] = useState<Tema>(temasDisponibles[0] ?? 'magia');
  const [estilo, setEstilo] = useState<Estilo>('aventura');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    setStory(null);
    try {
      const result = await api.stories.generate({ profileId: profile.id, tema, estilo });
      setStory(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo generar el cuento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      footer={
        <BubblyButton
          label={story ? 'Generar otro' : 'Generar cuento'}
          onPress={onGenerate}
          loading={loading}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.avatar}>{profile ? avatarEmoji(profile.avatar) : '🦊'}</Text>
        <Text style={styles.title}>Un cuento para {profile?.nombre ?? 'ti'}</Text>
      </View>

      <Text style={styles.fieldLabel}>Tema</Text>
      <View style={styles.chips}>
        {temasDisponibles.map((t) => (
          <SelectableChip
            key={t}
            label={TEMA_LABEL[t]}
            selected={tema === t}
            onPress={() => setTema(t)}
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>Estilo</Text>
      <View style={styles.chips}>
        {ESTILOS.map((s) => (
          <SelectableChip
            key={s}
            label={ESTILO_LABEL[s]}
            selected={estilo === s}
            onPress={() => setEstilo(s)}
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
