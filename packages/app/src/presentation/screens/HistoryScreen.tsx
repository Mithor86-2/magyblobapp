import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { ActivityCard } from '../components/ActivityCard';
import type { History, Story } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';
import type { TabScreenProps } from '../navigation';

export function HistoryScreen(_props: TabScreenProps<'Historial'>) {
  const profile = useAppStore((s) => s.currentProfile);

  const [history, setHistory] = useState<History>({ stories: [], activities: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      setHistory(await api.history.get(profile.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Recarga cada vez que la pestaña recibe foco (refleja cuentos leídos / actividades hechas).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onMarkRead(story: Story) {
    try {
      const updated = await api.stories.markRead(story.id);
      setHistory((prev) => ({
        ...prev,
        stories: prev.stories.map((s) => (s.id === story.id ? updated : s)),
      }));
    } catch {
      // si falla, el siguiente refresco de foco corrige el estado
    }
  }

  const hechas = history.activities.filter((a) => a.valoracion != null);

  return (
    <Screen>
      <Text style={styles.title}>Tu historial</Text>
      <Text style={styles.subtitle}>Mira todo lo que has aprendido y creado.</Text>

      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>Cuentos mágicos</Text>
      {history.stories.length === 0 ? (
        <Text style={styles.vacio}>Aún no hay cuentos. ¡Crea el primero!</Text>
      ) : (
        history.stories.map((story) => (
          <View key={story.id} style={styles.storyCard}>
            <View style={styles.storyHeader}>
              <Text style={styles.storyTitle} numberOfLines={1}>
                {story.titulo}
              </Text>
              <View
                style={[
                  styles.estado,
                  story.estado === 'leido' ? styles.estadoLeido : styles.estadoNuevo,
                ]}
              >
                <Text style={styles.estadoText}>
                  {story.estado === 'leido' ? 'Leído' : 'Nuevo'}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => onMarkRead(story)}
              disabled={story.estado === 'leido'}
            >
              <Text style={[styles.accion, story.estado === 'leido' && styles.accionDisabled]}>
                {story.estado === 'leido' ? 'Leído ✓' : 'Marcar como leído'}
              </Text>
            </Pressable>
          </View>
        ))
      )}

      <Text style={styles.section}>Actividades hechas</Text>
      {hechas.length === 0 ? (
        <Text style={styles.vacio}>Todavía no has completado actividades.</Text>
      ) : (
        hechas.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.displayLg,
    color: colors.tertiary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  section: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  vacio: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  error: {
    ...typography.labelBold,
    color: colors.onErrorContainer,
  },
  storyCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...softShadow,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  storyTitle: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
  },
  estado: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  estadoNuevo: {
    backgroundColor: colors.primaryContainer,
  },
  estadoLeido: {
    backgroundColor: colors.secondaryContainer,
  },
  estadoText: {
    ...typography.labelBold,
    color: colors.onSurface,
  },
  accion: {
    ...typography.labelBold,
    color: colors.primary,
  },
  accionDisabled: {
    color: colors.onSurfaceVariant,
  },
});
