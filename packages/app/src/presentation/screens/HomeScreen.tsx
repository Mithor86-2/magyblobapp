import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { AdultsButton } from '../components/AdultsButton';
import { BubblyButton } from '../components/BubblyButton';
import { ProgressBar } from '../components/ProgressBar';
import { avatarEmoji } from '../components/AvatarPicker';
import { api } from '../../composition';
import { useAppStore } from '../store/useAppStore';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, makeSoftShadow, spacing, typography } from '../theme/tokens';
import type { Achievement } from '../../domain/types';
import type { RootStackParamList, TabScreenProps } from '../navigation';

/** Máximo de trofeos (🏆) que se muestran en la card de Inicio; el resto se resume en "+N". */
const MAX_TROFEOS = 8;

/** Pantalla de bienvenida: saluda al niño actual y lleva a Cuentos / Actividades. */
export function HomeScreen({ navigation }: TabScreenProps<'Inicio'>) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const profile = useAppStore((s) => s.currentProfile);

  // Catálogo de logros (US-68/A4): alimenta la barra de progreso y la fila de trofeos.
  const [logros, setLogros] = useState<Achievement[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      // Best-effort: si falla, Home no muestra el resumen pero nunca rompe.
      void api.achievements
        .get(profile.id)
        .then((items) => setLogros(items))
        .catch(() => setLogros(null));
    }, [profile]),
  );

  const total = logros?.length ?? 0;
  const conseguidos = logros?.filter((l) => l.conseguido).length ?? 0;
  // Trofeos a pintar: uno por logro conseguido, acotado a MAX_TROFEOS (+N si sobran).
  const trofeosVisibles = Math.min(conseguidos, MAX_TROFEOS);
  const trofeosExtra = conseguidos - trofeosVisibles;

  // La zona de adultos vive en el stack raíz (sobre las pestañas), tras la puerta parental.
  const openParental = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Parental');

  // La vitrina de logros (US-68) también vive en el stack raíz, sobre las pestañas.
  const openAchievements = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Achievements');

  // US-82: búsqueda global (cuentos + actividades), pantalla del stack raíz.
  const openSearch = () =>
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('SearchResults');

  return (
    <Screen
      headerImageName="home"
      title={t('tabs.inicio')}
      headerAction={<AdultsButton onPress={openParental} />}
    >
      <View style={styles.hero}>
        <Text style={styles.avatar}>{profile ? avatarEmoji(profile.avatar) : '✨'}</Text>
        <Text style={styles.title}>
          {t('home.greeting', { nombre: profile ? `, ${profile.nombre}` : '' })}
        </Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

      {logros && total > 0 ? (
        <Pressable
          style={styles.achievementsCard}
          onPress={openAchievements}
          accessibilityRole="button"
          accessibilityLabel={t('home.achievementsSummary', { conseguidos, total })}
        >
          <View style={styles.achievementsHeader}>
            <Text style={styles.achievementsTitle}>{t('home.myAchievements')}</Text>
            <Text style={styles.achievementsCount}>
              {t('home.achievementsSummary', { conseguidos, total })}
            </Text>
          </View>
          <ProgressBar value={conseguidos} max={total} />

          {/* A4: trofeos ganados (uno por logro conseguido, acotado a MAX_TROFEOS + "+N"). */}
          {conseguidos > 0 ? (
            <View style={styles.trophies}>
              {Array.from({ length: trofeosVisibles }).map((_, i) => (
                <Text key={i} style={styles.trophy}>
                  🏆
                </Text>
              ))}
              {trofeosExtra > 0 ? (
                <Text style={styles.trophiesMore}>{`+${trofeosExtra}`}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.noAchievements}>{t('home.noAchievementsYet')}</Text>
          )}
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <BubblyButton
          label={t('home.createStory')}
          onPress={() => navigation.navigate('Cuentos')}
        />
        <BubblyButton
          label={t('home.seeActivities')}
          onPress={() => navigation.navigate('Actividades')}
          variant="secondary"
        />
        <BubblyButton
          label={t('home.myAchievements')}
          onPress={openAchievements}
          variant="secondary"
        />
        <BubblyButton label={t('home.search')} onPress={openSearch} variant="secondary" />
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    hero: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.lg,
    },
    avatar: {
      fontSize: 80,
    },
    title: {
      ...typography.displayLg,
      color: colors.primary,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.bodyLg,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    achievementsCard: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      marginTop: spacing.lg,
      ...makeSoftShadow(colors),
    },
    achievementsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    achievementsTitle: {
      ...typography.labelBold,
      color: colors.onSurface,
    },
    achievementsCount: {
      ...typography.labelBold,
      color: colors.primary,
    },
    trophies: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    trophy: {
      fontSize: 20,
    },
    trophiesMore: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
    noAchievements: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    actions: {
      gap: spacing.elementGap,
      marginTop: spacing.lg,
    },
  });
