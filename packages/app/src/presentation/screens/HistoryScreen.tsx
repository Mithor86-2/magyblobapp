import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AdultsButton } from '../components/AdultsButton';
import { Appear } from '../components/Appear';
import { ActivityCard } from '../components/ActivityCard';
import { AuthorBadge } from '../components/AuthorBadge';
import { BubblyButton } from '../components/BubblyButton';
import { FavoriteButton } from '../components/FavoriteButton';
import { SelectableChip } from '../components/SelectableChip';
import { TextField } from '../components/TextField';
import { Icon } from '../components/Icon';
import { CATEGORIAS, ENSENANZAS, ESTILOS, TEMAS } from '../../domain/types';
import type { History, Story } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { categoriaLabel, ensenanzaLabel, estiloLabel, temaLabel } from '../labels';
import { formatearFecha } from '../formatFecha';
import { DEFAULT_APP_LANGUAGE, esIdiomaApp } from '../../i18n';
import {
  filtrarActividades,
  filtrarCuentos,
  TODOS,
  ultimaActividad,
  ultimoCuento,
  type FiltroCategoria,
  type FiltroEnsenanza,
  type FiltroEstilo,
  type FiltroTema,
} from './historyFilters';
import { useAppStore } from '../store/useAppStore';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, makeSoftShadow, radius, spacing, typography } from '../theme/tokens';
import type { RootStackParamList, TabScreenProps } from '../navigation';

/**
 * Pantalla de **historial** del perfil activo (rediseño A3/US-74). Arriba, una franja
 * **"Lo último"** con destacados: el último cuento y la última actividad completada
 * (por fecha, `creadoEn`/`completadaEn`), siempre visibles si existen. Debajo, un
 * **toggle segmentado [Cuentos | Actividades]** (por defecto Cuentos) que muestra la
 * **lista completa** del tipo elegido. La búsqueda de texto y todos los filtros (tema,
 * estilo, enseñanza, categoría, favoritos) viven en un **modal** que se abre con el
 * botón "Buscar" y aplica a la **pestaña activa**; el botón muestra un contador de
 * filtros activos y hay un botón "Limpiar" que los resetea. El título del cuento se ve
 * completo. US-62/US-64/US-69/US-74. Recarga al recuperar el foco.
 */
export function HistoryScreen({ navigation }: TabScreenProps<'Historial'>) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const profile = useAppStore((s) => s.currentProfile);
  const idioma = esIdiomaApp(i18n.language) ? i18n.language : DEFAULT_APP_LANGUAGE;

  // El lector de cuentos vive en el stack raíz (sobre las pestañas).
  const openReader = (story: Story) =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('StoryReader', {
      story,
    });

  // Zona de adultos (A6): el botón fijo del header navega al stack raíz.
  const openParental = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Parental');

  const [history, setHistory] = useState<History>({ stories: [], activities: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros en cliente (US-62/US-64/US-69), estado local; "Todos" por defecto.
  const [temaFiltro, setTemaFiltro] = useState<FiltroTema>(TODOS);
  const [estiloFiltro, setEstiloFiltro] = useState<FiltroEstilo>(TODOS);
  const [ensenanzaFiltro, setEnsenanzaFiltro] = useState<FiltroEnsenanza>(TODOS);
  const [categoriaFiltro, setCategoriaFiltro] = useState<FiltroCategoria>(TODOS);
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  // A3: la búsqueda y los filtros se editan en un modal (la pantalla queda limpia).
  const [modalVisible, setModalVisible] = useState(false);
  // A3/US-74: pestaña activa del toggle (Cuentos por defecto); el modal filtra sobre ella.
  const [pestana, setPestana] = useState<'stories' | 'activities'>('stories');

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

  // Nº de filtros (chips) activos: alimenta el contador del botón "Filtros". La búsqueda
  // ya no cuenta aquí (ajuste #4): vive en el campo en línea, siempre visible.
  const filtrosActivos = [
    temaFiltro !== TODOS,
    estiloFiltro !== TODOS,
    ensenanzaFiltro !== TODOS,
    categoriaFiltro !== TODOS,
    soloFavoritos,
  ].filter(Boolean).length;

  const limpiarFiltros = () => {
    setTemaFiltro(TODOS);
    setEstiloFiltro(TODOS);
    setEnsenanzaFiltro(TODOS);
    setCategoriaFiltro(TODOS);
    setSoloFavoritos(false);
    setBusqueda('');
  };

  // "Hechas" = completadas (por `completadaEn`), aunque no tengan valoración (US-72);
  // coherente con cómo el backend cuenta las actividades completadas para los logros.
  const hechas = history.activities.filter((a) => a.completadaEn != null);
  // Listas filtradas en cliente (US-62 + US-64 + US-69) sobre lo ya cargado.
  const cuentosVisibles = filtrarCuentos(
    history.stories,
    temaFiltro,
    estiloFiltro,
    soloFavoritos,
    busqueda,
    ensenanzaFiltro,
  );
  const actividadesVisibles = filtrarActividades(hechas, categoriaFiltro, soloFavoritos, busqueda);

  // A3/US-74: destacados "Lo último" — el cuento y la actividad más recientes (por fecha),
  // al margen de los filtros; siempre visibles si existen.
  const cuentoDestacado = ultimoCuento(history.stories);
  const actividadDestacada = ultimaActividad(history.activities);

  // Tarjeta de cuento reutilizada por el destacado y por la lista de la pestaña Cuentos:
  // título completo, estado, favorito y acción que abre el lector.
  const renderStoryCard = (story: Story) => {
    const fecha = formatearFecha(story.creadoEn, idioma);
    return (
      <Appear key={story.id} style={styles.storyCard}>
        <View style={styles.storyHeader}>
          {/* A3: título completo (sin numberOfLines). */}
          <Text style={styles.storyTitle}>{story.titulo}</Text>
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
        {fecha ? <Text style={styles.fecha}>{t('common.generatedOn', { fecha })}</Text> : null}
      </Appear>
    );
  };

  return (
    <Screen title={t('tabs.historial')} headerAction={<AdultsButton onPress={openParental} />}>
      <Text style={styles.title}>{t('history.title')}</Text>
      <Text style={styles.subtitle}>{t('history.subtitle')}</Text>

      {/* Ajuste #4: búsqueda EN VIVO en línea (como el buscador de Inicio), que filtra la
          pestaña activa a medida que se escribe; combina con los filtros del modal. */}
      <TextField
        label={t('history.searchLabel')}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder={t('history.searchPlaceholder')}
        autoCapitalize="none"
        testID="history-search"
      />

      {/* El modal se queda solo con los filtros (chips); el botón muestra su nº activo. */}
      <View style={styles.toolbar}>
        <View style={styles.searchButton}>
          <BubblyButton
            label={
              filtrosActivos > 0
                ? t('history.filtersWithCount', { count: filtrosActivos })
                : t('history.filters')
            }
            icon="search"
            variant="secondary"
            onPress={() => setModalVisible(true)}
          />
        </View>
        {filtrosActivos > 0 || busqueda.trim() !== '' ? (
          <BubblyButton label={t('common.clear')} variant="secondary" onPress={limpiarFiltros} />
        ) : null}
      </View>

      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <BubblyButton label={t('common.retry')} onPress={() => void load()} variant="secondary" />
        </View>
      ) : null}

      {/* A3/US-74: franja "Lo último" con el último cuento y la última actividad. */}
      {cuentoDestacado || actividadDestacada ? (
        <View style={styles.destacados}>
          <Text style={styles.section}>{t('history.latest')}</Text>
          {cuentoDestacado ? (
            <View>
              <Text style={styles.destacadoLabel}>{t('history.lastStory')}</Text>
              {renderStoryCard(cuentoDestacado)}
            </View>
          ) : null}
          {actividadDestacada ? (
            <View>
              <Text style={styles.destacadoLabel}>{t('history.lastActivity')}</Text>
              <ActivityCard activity={actividadDestacada} />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* A3/US-74: toggle segmentado [Cuentos | Actividades]; el modal filtra la activa. */}
      <View style={styles.segmented} accessibilityRole="tablist">
        <Pressable
          onPress={() => setPestana('stories')}
          accessibilityRole="button"
          accessibilityState={{ selected: pestana === 'stories' }}
          testID="history-tab-stories"
          style={[styles.segment, pestana === 'stories' ? styles.segmentActive : null]}
        >
          <Text
            style={[styles.segmentText, pestana === 'stories' ? styles.segmentTextActive : null]}
          >
            {t('history.tabStories')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPestana('activities')}
          accessibilityRole="button"
          accessibilityState={{ selected: pestana === 'activities' }}
          testID="history-tab-activities"
          style={[styles.segment, pestana === 'activities' ? styles.segmentActive : null]}
        >
          <Text
            style={[styles.segmentText, pestana === 'activities' ? styles.segmentTextActive : null]}
          >
            {t('history.tabActivities')}
          </Text>
        </Pressable>
      </View>

      {pestana === 'stories' ? (
        <View testID="history-stories" style={styles.activitiesSection}>
          {history.stories.length === 0 ? (
            <Text style={styles.vacio}>{t('history.emptyStories')}</Text>
          ) : cuentosVisibles.length === 0 ? (
            <Text style={styles.vacio}>{t('history.noMatchStories')}</Text>
          ) : (
            cuentosVisibles.map((story) => renderStoryCard(story))
          )}
        </View>
      ) : (
        // `testID` para acotar la sección en los E2E: el tab navigator mantiene
        // montada también la pestaña Actividades, cuyas tarjetas coinciden en texto.
        <View testID="history-activities" style={styles.activitiesSection}>
          {hechas.length === 0 ? (
            <Text style={styles.vacio}>{t('history.emptyActivities')}</Text>
          ) : actividadesVisibles.length === 0 ? (
            <Text style={styles.vacio}>{t('history.noMatchActivities')}</Text>
          ) : (
            actividadesVisibles.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          )}
        </View>
      )}

      <SearchFiltersModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onClear={limpiarFiltros}
        temaFiltro={temaFiltro}
        setTemaFiltro={setTemaFiltro}
        estiloFiltro={estiloFiltro}
        setEstiloFiltro={setEstiloFiltro}
        ensenanzaFiltro={ensenanzaFiltro}
        setEnsenanzaFiltro={setEnsenanzaFiltro}
        categoriaFiltro={categoriaFiltro}
        setCategoriaFiltro={setCategoriaFiltro}
        soloFavoritos={soloFavoritos}
        setSoloFavoritos={setSoloFavoritos}
      />
    </Screen>
  );
}

interface SearchFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onClear: () => void;
  temaFiltro: FiltroTema;
  setTemaFiltro: (v: FiltroTema) => void;
  estiloFiltro: FiltroEstilo;
  setEstiloFiltro: (v: FiltroEstilo) => void;
  ensenanzaFiltro: FiltroEnsenanza;
  setEnsenanzaFiltro: (v: FiltroEnsenanza) => void;
  categoriaFiltro: FiltroCategoria;
  setCategoriaFiltro: (v: FiltroCategoria) => void;
  soloFavoritos: boolean;
  setSoloFavoritos: (v: boolean) => void;
}

/**
 * Modal de **filtros** del Historial (A3; ajuste #4: la búsqueda se sacó a un campo en
 * línea siempre visible). Cabecera con título y botón "X", los filtros (tema, estilo,
 * enseñanza, categoría, favoritos) y botones Aplicar (cierra) y Limpiar (resetea).
 * Edita los filtros en vivo (el listado ya es reactivo); "Aplicar" y la "X" solo cierran
 * el modal con lo elegido aplicado. Se exporta para poder probarlo de forma aislada (US-30).
 */
export function SearchFiltersModal(props: SearchFiltersModalProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);

  return (
    <Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* A3: cabecera con título y botón "X" para cerrar el modal arriba a la derecha. */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('history.filtersTitle')}</Text>
            <Pressable
              onPress={props.onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={styles.modalClose}
            >
              <Icon name="close" size="md" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <FilterGroup
              label={t('history.filterTheme')}
              options={TEMAS.map((tema) => ({ value: tema, label: temaLabel(tema) }))}
              selected={props.temaFiltro}
              onSelect={(v) => props.setTemaFiltro(v as FiltroTema)}
            />
            <FilterGroup
              label={t('history.filterStyle')}
              options={ESTILOS.map((e) => ({ value: e, label: estiloLabel(e) }))}
              selected={props.estiloFiltro}
              onSelect={(v) => props.setEstiloFiltro(v as FiltroEstilo)}
            />
            <FilterGroup
              label={t('history.filterTeaching')}
              options={ENSENANZAS.map((e) => ({ value: e, label: ensenanzaLabel(e) }))}
              selected={props.ensenanzaFiltro}
              onSelect={(v) => props.setEnsenanzaFiltro(v as FiltroEnsenanza)}
            />
            <FilterGroup
              label={t('history.filterCategory')}
              options={CATEGORIAS.map((c) => ({ value: c, label: categoriaLabel(c) }))}
              selected={props.categoriaFiltro}
              onSelect={(v) => props.setCategoriaFiltro(v as FiltroCategoria)}
            />

            <View style={styles.chipRow}>
              <SelectableChip
                label={t('history.onlyFavorites')}
                selected={props.soloFavoritos}
                onPress={() => props.setSoloFavoritos(!props.soloFavoritos)}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <View style={styles.modalActionMain}>
              <BubblyButton label={t('history.applyFilters')} onPress={props.onClose} />
            </View>
            <BubblyButton label={t('common.clear')} variant="secondary" onPress={props.onClear} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface FilterGroupProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

/** Grupo de chips de un filtro con la opción "Todos" al inicio (A3, dentro del modal). */
function FilterGroup({ label, options, selected, onSelect }: FilterGroupProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.chipRowWrap}>
        <SelectableChip
          label={t('history.filterAll')}
          selected={selected === TODOS}
          onPress={() => onSelect(TODOS)}
        />
        {options.map((o) => (
          <SelectableChip
            key={o.value}
            label={o.label}
            selected={selected === o.value}
            onPress={() => onSelect(o.value)}
          />
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    title: {
      ...typography.displayLg,
      color: colors.tertiary,
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    toolbar: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    searchButton: {
      flex: 1,
    },
    section: {
      ...typography.headlineMd,
      color: colors.onSurface,
      marginTop: spacing.sm,
    },
    activitiesSection: {
      gap: spacing.sm,
    },
    destacados: {
      gap: spacing.sm,
    },
    destacadoLabel: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.pill,
      padding: 4,
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    segmentActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
    segmentTextActive: {
      color: colors.onPrimary,
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
    filterGroup: {
      gap: spacing.xs,
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chipRowWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
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
      ...makeSoftShadow(colors),
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
    modalBackdrop: {
      flex: 1,
      // Sin token de scrim en el tema: overlay translúcido neutro para ambos esquemas.
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    modalTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
      flex: 1,
    },
    modalClose: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBody: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    modalActionMain: {
      flex: 1,
    },
  });
