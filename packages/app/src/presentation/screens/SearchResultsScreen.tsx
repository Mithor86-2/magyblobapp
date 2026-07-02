import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { ActivityCard } from '../components/ActivityCard';
import { TextField } from '../components/TextField';
import { Icon } from '../components/Icon';
import type { History, Story } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { filtrarActividades, filtrarCuentos, TODOS } from './historyFilters';
import { useAppStore } from '../store/useAppStore';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, makeSoftShadow, radius, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Búsqueda global (US-82): una pantalla con un campo de texto que, sobre la biblioteca
 * del perfil activo (`GET /profiles/:id/history`), muestra en un solo listado los
 * **cuentos y las actividades** que coinciden. Reutiliza los filtros puros del
 * Historial (`filtrarCuentos`/`filtrarActividades`, US-64) con la búsqueda de texto y
 * el resto de filtros en "Todos". Al tocar un cuento se abre el lector; las actividades
 * se muestran como tarjetas de solo lectura. Se carga al enfocar la pantalla.
 */
export function SearchResultsScreen({ navigation }: RootScreenProps<'SearchResults'>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const profile = useAppStore((s) => s.currentProfile);

  const [history, setHistory] = useState<History>({ stories: [], activities: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      setHistory(await api.history.get(profile.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('search.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [profile, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const q = busqueda.trim();
  // Búsqueda combinada: filtros en "Todos", solo aplica el texto (US-64/US-82).
  const cuentos = q === '' ? [] : filtrarCuentos(history.stories, TODOS, TODOS, false, busqueda);
  const actividades =
    q === '' ? [] : filtrarActividades(history.activities, TODOS, false, busqueda);
  const sinResultados = q !== '' && cuentos.length === 0 && actividades.length === 0;

  return (
    <Screen>
      <TextField
        label={t('nav.search')}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder={t('search.placeholder')}
        autoCapitalize="none"
        testID="search-input"
      />

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {q === '' ? <Text style={styles.hint}>{t('search.hint')}</Text> : null}
      {sinResultados ? <Text style={styles.hint}>{t('search.empty', { q })}</Text> : null}

      {cuentos.length > 0 ? (
        <View style={styles.section} testID="search-stories">
          <Text style={styles.sectionTitle}>{t('search.stories')}</Text>
          {cuentos.map((story) => (
            <Pressable
              key={story.id}
              onPress={() => navigation.navigate('StoryReader', { story })}
              accessibilityRole="button"
              accessibilityLabel={t('history.readStoryA11y', { titulo: story.titulo })}
              style={styles.storyCard}
            >
              <Text style={styles.storyTitle}>{story.titulo}</Text>
              <Icon name="arrow-right" size="sm" color={colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {actividades.length > 0 ? (
        <View style={styles.section} testID="search-activities">
          <Text style={styles.sectionTitle}>{t('search.activities')}</Text>
          {actividades.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
    },
    storyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...makeSoftShadow(colors),
    },
    storyTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
      flex: 1,
    },
    hint: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    error: {
      ...typography.bodyMd,
      color: colors.error,
    },
  });
