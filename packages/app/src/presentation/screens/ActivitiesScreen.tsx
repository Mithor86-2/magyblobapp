import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AdultsButton } from '../components/AdultsButton';
import { BubblyButton } from '../components/BubblyButton';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { SelectableChip } from '../components/SelectableChip';
import { ActivityCard } from '../components/ActivityCard';
import { useDialog } from '../components/DialogProvider';
import { CATEGORIAS } from '../../domain/types';
import type { Activity, Categoria } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { categoriaLabel } from '../labels';
import { categoriaIcon } from '../chipIcons';
import { avatarEmoji } from '../components/AvatarPicker';
import { vocabColor } from '../vocabColor';
import { api } from '../../composition';
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

  // US-09: sin opción "Todas"; se genera UNA actividad de la categoría elegida por pulsación.
  const [categoria, setCategoria] = useState<Categoria>(CATEGORIAS[0]);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generado, setGenerado] = useState(false);

  async function onGenerate() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    trackAction('activities.recommend', { categoria });
    try {
      const result = await api.activities.recommend({
        profileId: profile.id,
        categoria,
        cantidad: 1,
      });
      setActivities(result);
      setGenerado(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('activities.errorGenerate'));
    } finally {
      setLoading(false);
    }
  }

  async function onComplete(activityId: string, valoracion?: number) {
    trackAction('activity.complete', { valoracion: valoracion ?? 'sin_valoracion' });
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
      title={t('common.appName')}
      headerAction={<AdultsButton onPress={openParental} />}
      footer={
        <BubblyButton
          label={generado ? t('activities.generateMore') : t('activities.generate')}
          icon="activities"
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
        {CATEGORIAS.map((c) => (
          <SelectableChip
            key={c}
            label={categoriaLabel(c)}
            selected={categoria === c}
            onPress={() => setCategoria(c)}
            icon={categoriaIcon(c)}
            tint={vocabColor(colors, c)}
          />
        ))}
      </View>

      {/* US-102: loader a pantalla completa mientras se generan las actividades, con el avatar. */}
      <FullScreenLoader
        visible={loading}
        message={t('activities.preparing')}
        avatar={profile ? avatarEmoji(profile.avatar) : undefined}
      />

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
          pasosVisiblesInicial
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
