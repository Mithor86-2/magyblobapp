import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { ActivityCard } from '../components/ActivityCard';
import { useDialog } from '../components/DialogProvider';
import { CATEGORIAS } from '../../domain/types';
import type { Activity, Categoria } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { CATEGORIA_LABEL } from '../labels';
import { api } from '../../composition';
import { trackAction } from '../../infrastructure/telemetry';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { TabScreenProps } from '../navigation';

export function ActivitiesScreen(_props: TabScreenProps<'Actividades'>) {
  const profile = useAppStore((s) => s.currentProfile);
  const dialog = useDialog();

  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generado, setGenerado] = useState(false);

  async function onGenerate() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    trackAction('activities.recommend', { categoria: categoria ?? 'todas' });
    try {
      const result = await api.activities.recommend({
        profileId: profile.id,
        categoria: categoria ?? undefined,
      });
      setActivities(result);
      setGenerado(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron generar las actividades.');
    } finally {
      setLoading(false);
    }
  }

  async function onComplete(activityId: string, valoracion: number) {
    trackAction('activity.complete', { valoracion });
    try {
      const updated = await api.activities.complete(activityId, valoracion);
      setActivities((prev) => prev.map((a) => (a.id === activityId ? updated : a)));
    } catch (e) {
      dialog.alert({
        title: 'Ups',
        message: e instanceof ApiError ? e.message : 'No se pudo guardar la valoración.',
      });
    }
  }

  return (
    <Screen
      footer={
        <BubblyButton
          label={generado ? 'Generar más' : 'Generar actividades'}
          onPress={onGenerate}
          loading={loading}
          variant="secondary"
        />
      }
    >
      <Text style={styles.title}>Actividades para hoy</Text>
      <Text style={styles.subtitle}>
        ¡Es hora de jugar y aprender, {profile?.nombre ?? 'peque'}!
      </Text>

      <Text style={styles.fieldLabel}>Categoría</Text>
      <View style={styles.chips}>
        <SelectableChip
          label="Todas"
          selected={categoria === null}
          onPress={() => setCategoria(null)}
        />
        {CATEGORIAS.map((c) => (
          <SelectableChip
            key={c}
            label={CATEGORIA_LABEL[c]}
            selected={categoria === c}
            onPress={() => setCategoria(c)}
          />
        ))}
      </View>

      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>Preparando actividades…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.statusBox, styles.errorBox]}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.statusText}>Toca «Generar actividades» para reintentar.</Text>
        </View>
      ) : null}

      {!loading && generado && activities.length === 0 && !error ? (
        <Text style={styles.statusText}>No hay actividades nuevas. Prueba otra categoría.</Text>
      ) : null}

      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onComplete={(v) => onComplete(activity.id, v)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.displayLg,
    color: colors.secondary,
  },
  subtitle: {
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
