import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { ActivityCard } from '../components/ActivityCard';
import { AuthorBadge } from '../components/AuthorBadge';
import { BubblyButton } from '../components/BubblyButton';
import { Icon } from '../components/Icon';
import type { History, Story } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';
import type { RootStackParamList, TabScreenProps } from '../navigation';

export function HistoryScreen({ navigation }: TabScreenProps<'Historial'>) {
  const profile = useAppStore((s) => s.currentProfile);

  // El lector de cuentos vive en el stack raíz (sobre las pestañas).
  const openReader = (story: Story) =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('StoryReader', {
      story,
    });

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

  const hechas = history.activities.filter((a) => a.valoracion != null);

  return (
    <Screen>
      <Text style={styles.title}>Tu historial</Text>
      <Text style={styles.subtitle}>Mira todo lo que has aprendido y creado.</Text>

      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <BubblyButton label="Reintentar" onPress={() => void load()} variant="secondary" />
        </View>
      ) : null}

      <Text style={styles.section}>Cuentos mágicos</Text>
      {history.stories.length === 0 ? (
        <Text style={styles.vacio}>Aún no hay cuentos. ¡Crea el primero!</Text>
      ) : (
        history.stories.map((story) => (
          <Pressable
            key={story.id}
            style={styles.storyCard}
            onPress={() => openReader(story)}
            accessibilityRole="button"
            accessibilityLabel={`Leer el cuento ${story.titulo}`}
          >
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
            <View style={styles.accionRow}>
              <Text style={styles.accion}>Leer cuento</Text>
              <Icon name="arrow-right" size="sm" color={colors.primary} />
            </View>
            <AuthorBadge proveedor={story.proveedor} />
          </Pressable>
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
  errorBox: {
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  error: {
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
  accionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  accion: {
    ...typography.labelBold,
    color: colors.primary,
  },
});
