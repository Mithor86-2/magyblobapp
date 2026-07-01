import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AdultsButton } from '../components/AdultsButton';
import { BubblyButton } from '../components/BubblyButton';
import { SelectableChip } from '../components/SelectableChip';
import { ActivityCard } from '../components/ActivityCard';
import { useDialog } from '../components/DialogProvider';
import { CATEGORIAS } from '../../domain/types';
import type { Activity, Categoria } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { categoriaLabel } from '../labels';
import { api } from '../../composition';
import { useSlowHint } from '../hooks/useSlowHint';
import { trackAction } from '../../infrastructure/telemetry';
import { useAppStore } from '../store/useAppStore';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';
import type { RootStackParamList, TabScreenProps } from '../navigation';

/**
 * Pantalla de **actividades recomendadas** para el perfil activo. Permite filtrar
 * por categoría, pide recomendaciones al `api` inyectado y las muestra en tarjetas
 * (con opción de marcarlas). US-09, US-10.
 */
export function ActivitiesScreen({ navigation }: TabScreenProps<'Actividades'>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const profile = useAppStore((s) => s.currentProfile);
  const dialog = useDialog();

  // Zona de adultos (A6): el botón fijo del header navega al stack raíz.
  const openParental = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Parental');

  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generado, setGenerado] = useState(false);
  // Aviso de espera larga (US-53, cold-start de Render free).
  const lento = useSlowHint(loading);

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
      setError(e instanceof ApiError ? e.message : t('activities.errorGenerate'));
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
        title: t('common.ups'),
        message: e instanceof ApiError ? e.message : t('activities.errorRating'),
      });
    }
  }

  return (
    <Screen
      headerImageName="actividades"
      headerAction={<AdultsButton onPress={openParental} />}
      footer={
        <BubblyButton
          label={generado ? t('activities.generateMore') : t('activities.generate')}
          onPress={onGenerate}
          loading={loading}
          variant="secondary"
        />
      }
    >
      <Text style={styles.title}>{t('activities.title')}</Text>
      <Text style={styles.subtitle}>
        {t('activities.subtitle', { nombre: profile?.nombre ?? t('activities.pequeFallback') })}
      </Text>

      <Text style={styles.fieldLabel}>{t('activities.category')}</Text>
      <View style={styles.chips}>
        <SelectableChip
          label={t('activities.all')}
          selected={categoria === null}
          onPress={() => setCategoria(null)}
        />
        {CATEGORIAS.map((c) => (
          <SelectableChip
            key={c}
            label={categoriaLabel(c)}
            selected={categoria === c}
            onPress={() => setCategoria(c)}
          />
        ))}
      </View>

      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>{t('activities.preparing')}</Text>
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
          <Text style={styles.statusText}>{t('activities.retryHint')}</Text>
        </View>
      ) : null}

      {!loading && generado && activities.length === 0 && !error ? (
        <Text style={styles.statusText}>{t('activities.emptyNew')}</Text>
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

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
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
