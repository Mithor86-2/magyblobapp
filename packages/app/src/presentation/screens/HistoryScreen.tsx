import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { ActivityCard } from '../components/ActivityCard';
import { AuthorBadge } from '../components/AuthorBadge';
import { BubblyButton } from '../components/BubblyButton';
import { FavoriteButton } from '../components/FavoriteButton';
import { SelectableChip } from '../components/SelectableChip';
import { TextField } from '../components/TextField';
import { Icon } from '../components/Icon';
import { CATEGORIAS, ESTILOS, TEMAS } from '../../domain/types';
import type { History, Story } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { categoriaLabel, estiloLabel, temaLabel } from '../labels';
import { formatearFecha } from '../formatFecha';
import { DEFAULT_APP_LANGUAGE, esIdiomaApp } from '../../i18n';
import {
  filtrarActividades,
  filtrarCuentos,
  TODOS,
  type FiltroCategoria,
  type FiltroEstilo,
  type FiltroTema,
} from './historyFilters';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';
import type { RootStackParamList, TabScreenProps } from '../navigation';

export function HistoryScreen({ navigation }: TabScreenProps<'Historial'>) {
  const { t, i18n } = useTranslation();
  const profile = useAppStore((s) => s.currentProfile);
  const idioma = esIdiomaApp(i18n.language) ? i18n.language : DEFAULT_APP_LANGUAGE;

  // El lector de cuentos vive en el stack raíz (sobre las pestañas).
  const openReader = (story: Story) =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('StoryReader', {
      story,
    });

  const [history, setHistory] = useState<History>({ stories: [], activities: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros en cliente (US-62), estado local; "Todos" por defecto.
  const [temaFiltro, setTemaFiltro] = useState<FiltroTema>(TODOS);
  const [estiloFiltro, setEstiloFiltro] = useState<FiltroEstilo>(TODOS);
  const [categoriaFiltro, setCategoriaFiltro] = useState<FiltroCategoria>(TODOS);
  // Favoritos + búsqueda de texto (US-64), también local.
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      setHistory(await api.history.get(profile.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('history.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [profile, t]);

  // Recarga cada vez que la pestaña recibe foco (refleja cuentos leídos / actividades hechas).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Alterna el favorito de un cuento en el estado local (US-64) para que el chip
  // "Solo favoritos" y la estrella reflejen el cambio; el FavoriteButton ya es optimista.
  const toggleFavoritoCuento = (storyId: string, favorito: boolean) => {
    setHistory((h) => ({
      ...h,
      stories: h.stories.map((s) => (s.id === storyId ? { ...s, favorito } : s)),
    }));
    return api.stories.setFavorite(storyId, favorito);
  };

  const hechas = history.activities.filter((a) => a.valoracion != null);
  // Listas filtradas en cliente (US-62 + US-64) sobre lo ya cargado.
  const cuentosVisibles = filtrarCuentos(
    history.stories,
    temaFiltro,
    estiloFiltro,
    soloFavoritos,
    busqueda,
  );
  const actividadesVisibles = filtrarActividades(hechas, categoriaFiltro, soloFavoritos, busqueda);

  return (
    <Screen>
      <Text style={styles.title}>{t('history.title')}</Text>
      <Text style={styles.subtitle}>{t('history.subtitle')}</Text>

      {/* Búsqueda de texto + filtro favoritos (US-64): afectan a cuentos y actividades. */}
      <TextField
        label={t('history.searchLabel')}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder={t('history.searchPlaceholder')}
        autoCapitalize="none"
        testID="history-search"
      />
      <View style={styles.chipRow}>
        <SelectableChip
          label={t('history.onlyFavorites')}
          selected={soloFavoritos}
          onPress={() => setSoloFavoritos((v) => !v)}
        />
      </View>

      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <BubblyButton label={t('common.retry')} onPress={() => void load()} variant="secondary" />
        </View>
      ) : null}

      <Text style={styles.section}>{t('history.sectionStories')}</Text>
      {history.stories.length === 0 ? (
        <Text style={styles.vacio}>{t('history.emptyStories')}</Text>
      ) : (
        <>
          <Text style={styles.filterLabel}>{t('history.filterTheme')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <SelectableChip
              label={t('history.filterAll')}
              selected={temaFiltro === TODOS}
              onPress={() => setTemaFiltro(TODOS)}
            />
            {TEMAS.map((tema) => (
              <SelectableChip
                key={tema}
                label={temaLabel(tema)}
                selected={temaFiltro === tema}
                onPress={() => setTemaFiltro(tema)}
              />
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>{t('history.filterStyle')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <SelectableChip
              label={t('history.filterAll')}
              selected={estiloFiltro === TODOS}
              onPress={() => setEstiloFiltro(TODOS)}
            />
            {ESTILOS.map((estilo) => (
              <SelectableChip
                key={estilo}
                label={estiloLabel(estilo)}
                selected={estiloFiltro === estilo}
                onPress={() => setEstiloFiltro(estilo)}
              />
            ))}
          </ScrollView>

          {cuentosVisibles.length === 0 ? (
            <Text style={styles.vacio}>{t('history.noMatchStories')}</Text>
          ) : (
            cuentosVisibles.map((story) => {
              const fecha = formatearFecha(story.creadoEn, idioma);
              // La estrella de favorito es un control aparte: el área pulsable que
              // abre la lectura no la envuelve (evita un botón anidado en otro).
              return (
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
                        {story.estado === 'leido' ? t('history.read') : t('history.new')}
                      </Text>
                    </View>
                    <FavoriteButton
                      favorito={story.favorito}
                      onToggle={(favorito) => toggleFavoritoCuento(story.id, favorito)}
                    />
                  </View>
                  <Pressable
                    onPress={() => openReader(story)}
                    accessibilityRole="button"
                    accessibilityLabel={t('history.readStoryA11y', { titulo: story.titulo })}
                    style={styles.accionRow}
                  >
                    <Text style={styles.accion}>{t('history.readStory')}</Text>
                    <Icon name="arrow-right" size="sm" color={colors.primary} />
                  </Pressable>
                  <AuthorBadge proveedor={story.proveedor} />
                  {fecha ? (
                    <Text style={styles.fecha}>{t('common.generatedOn', { fecha })}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </>
      )}

      <Text style={styles.section}>{t('history.sectionActivities')}</Text>
      {hechas.length === 0 ? (
        <Text style={styles.vacio}>{t('history.emptyActivities')}</Text>
      ) : (
        <>
          <Text style={styles.filterLabel}>{t('history.filterCategory')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <SelectableChip
              label={t('history.filterAll')}
              selected={categoriaFiltro === TODOS}
              onPress={() => setCategoriaFiltro(TODOS)}
            />
            {CATEGORIAS.map((categoria) => (
              <SelectableChip
                key={categoria}
                label={categoriaLabel(categoria)}
                selected={categoriaFiltro === categoria}
                onPress={() => setCategoriaFiltro(categoria)}
              />
            ))}
          </ScrollView>

          {actividadesVisibles.length === 0 ? (
            <Text style={styles.vacio}>{t('history.noMatchActivities')}</Text>
          ) : (
            actividadesVisibles.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          )}
        </>
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
  filterLabel: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fecha: {
    ...typography.labelBold,
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
