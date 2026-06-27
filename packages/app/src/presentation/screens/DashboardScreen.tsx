import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { ActivityCard } from '../components/ActivityCard';
import { AuthorBadge } from '../components/AuthorBadge';
import { TEMAS, ESTILOS } from '../../domain/types';
import type { AnonymousActivity, AnonymousStory, Estilo, Tema } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { estiloLabel, temaLabel } from '../labels';
import { api } from '../../composition';
import { trackAction } from '../../infrastructure/telemetry';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Inicio sin sesión (US-50): explica la app y deja **probar** la generación de
 * cuentos y actividades en **modo anónimo efímero** (sin cuenta, sin persistir
 * nada). El uso es limitado por un **contador efímero** en el cliente (hasta 3
 * cuentos + 3 actividades); el backend lo refuerza con su propio rate-limit. Desde
 * aquí se llega a crear cuenta o iniciar sesión.
 *
 * El modo anónimo no maneja perfil de niño: se generan con una **edad e idioma por
 * defecto** y los temas/estilos elegidos (no se envía ningún nombre).
 */
const LIMITE_GRATIS = 3;
const EDAD_DEFECTO = 4;

export function DashboardScreen({ navigation }: RootScreenProps<'Dashboard'>) {
  const { t } = useTranslation();
  const [temas, setTemas] = useState<Tema[]>([TEMAS[0]]);
  const [estilos, setEstilos] = useState<Estilo[]>([ESTILOS[0]]);
  const [story, setStory] = useState<AnonymousStory | null>(null);
  const [activities, setActivities] = useState<AnonymousActivity[]>([]);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contadores efímeros (no persistentes): se reinician al cerrar la app.
  const [cuentosUsados, setCuentosUsados] = useState(0);
  const [actividadesUsadas, setActividadesUsadas] = useState(0);

  const quedanCuentos = cuentosUsados < LIMITE_GRATIS;
  const quedanActividades = actividadesUsadas < LIMITE_GRATIS;
  const puedeGenerarCuento = quedanCuentos && temas.length > 0 && estilos.length > 0;

  function toggleTema(t: Tema) {
    setTemas((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function toggleEstilo(s: Estilo) {
    setEstilos((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function onGenerateStory() {
    if (!puedeGenerarCuento) return;
    setLoadingStory(true);
    setError(null);
    setStory(null);
    trackAction('anonymous.story.generate', { temas: temas.join(','), estilos: estilos.join(',') });
    try {
      const result = await api.stories.generateAnonymous({
        edad: EDAD_DEFECTO,
        temas,
        estilos,
      });
      setStory(result);
      setCuentosUsados((n) => n + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('dashboard.errorStory'));
    } finally {
      setLoadingStory(false);
    }
  }

  async function onGenerateActivities() {
    if (!quedanActividades) return;
    setLoadingActivities(true);
    setError(null);
    trackAction('anonymous.activities.recommend', {});
    try {
      const result = await api.activities.recommendAnonymous({ edad: EDAD_DEFECTO });
      setActivities(result);
      setActividadesUsadas((n) => n + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('dashboard.errorActivities'));
    } finally {
      setLoadingActivities(false);
    }
  }

  return (
    <Screen
      headerImageName="dashboard"
      footer={
        <View style={styles.footerActions}>
          <BubblyButton
            label={t('common.createAccount')}
            onPress={() => navigation.navigate('Consent')}
          />
          <BubblyButton
            label={t('common.haveAccount')}
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
          />
        </View>
      }
    >
      <View style={styles.hero}>
        <Text style={styles.logo}>✨</Text>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <Text style={styles.subtitle}>{t('dashboard.subtitle', { limite: LIMITE_GRATIS })}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t('dashboard.tryStory')}</Text>
      <Text style={styles.fieldLabel}>{t('dashboard.themes')}</Text>
      <View style={styles.chips}>
        {TEMAS.map((tema) => (
          <SelectableChip
            key={tema}
            label={temaLabel(tema)}
            selected={temas.includes(tema)}
            onPress={() => toggleTema(tema)}
          />
        ))}
      </View>
      <Text style={styles.fieldLabel}>{t('dashboard.styles')}</Text>
      <View style={styles.chips}>
        {ESTILOS.map((s) => (
          <SelectableChip
            key={s}
            label={estiloLabel(s)}
            selected={estilos.includes(s)}
            onPress={() => toggleEstilo(s)}
          />
        ))}
      </View>
      <BubblyButton
        label={quedanCuentos ? t('dashboard.generateStory') : t('dashboard.limitReached')}
        onPress={onGenerateStory}
        loading={loadingStory}
        disabled={!puedeGenerarCuento}
      />
      <Text style={styles.usos}>
        {t('dashboard.storiesUsed', { usados: cuentosUsados, limite: LIMITE_GRATIS })}
      </Text>

      {loadingStory ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>{t('dashboard.creatingStory')}</Text>
        </View>
      ) : null}

      {story ? (
        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>{story.titulo}</Text>
          <Text style={styles.storyBody}>{story.cuerpo}</Text>
          <AuthorBadge proveedor={story.proveedor} />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{t('dashboard.tryActivities')}</Text>
      <BubblyButton
        label={quedanActividades ? t('dashboard.generateActivities') : t('dashboard.limitReached')}
        onPress={onGenerateActivities}
        loading={loadingActivities}
        disabled={!quedanActividades}
        variant="secondary"
      />
      <Text style={styles.usos}>
        {t('dashboard.activitiesUsed', { usadas: actividadesUsadas, limite: LIMITE_GRATIS })}
      </Text>

      {loadingActivities ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>{t('dashboard.preparingActivities')}</Text>
        </View>
      ) : null}

      {activities.map((activity, i) => (
        // Modo anónimo: sin valoración (no hay perfil). Se adapta al tipo `Activity`
        // con un id/profileId locales solo para el render; no se persiste.
        <ActivityCard
          key={`${activity.titulo}-${i}`}
          activity={{ ...activity, id: `anon-${i}`, profileId: 'anon' }}
        />
      ))}

      {error ? (
        <View style={[styles.statusBox, styles.errorBox]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  logo: {
    fontSize: 64,
  },
  title: {
    ...typography.displayLg,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.secondary,
    marginTop: spacing.md,
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
  usos: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  statusBox: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
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
  footerActions: {
    gap: spacing.sm,
  },
});
