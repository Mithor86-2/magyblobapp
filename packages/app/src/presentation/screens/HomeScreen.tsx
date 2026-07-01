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
import type { RootStackParamList, TabScreenProps } from '../navigation';

/** Pantalla de bienvenida: saluda al niño actual y lleva a Cuentos / Actividades. */
export function HomeScreen({ navigation }: TabScreenProps<'Inicio'>) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const profile = useAppStore((s) => s.currentProfile);

  // Resumen de logros (US-68/A4): conseguidos y total, para la barra de progreso.
  const [logros, setLogros] = useState<{ conseguidos: number; total: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      // Best-effort: si falla, Home no muestra el resumen pero nunca rompe.
      void api.achievements
        .get(profile.id)
        .then((items) =>
          setLogros({ conseguidos: items.filter((l) => l.conseguido).length, total: items.length }),
        )
        .catch(() => setLogros(null));
    }, [profile]),
  );

  // La zona de adultos vive en el stack raíz (sobre las pestañas), tras la puerta parental.
  const openParental = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Parental');

  // La vitrina de logros (US-68) también vive en el stack raíz, sobre las pestañas.
  const openAchievements = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Achievements');

  return (
    <Screen headerImageName="home" headerAction={<AdultsButton onPress={openParental} />}>
      <View style={styles.hero}>
        <Text style={styles.avatar}>{profile ? avatarEmoji(profile.avatar) : '✨'}</Text>
        <Text style={styles.title}>
          {t('home.greeting', { nombre: profile ? `, ${profile.nombre}` : '' })}
        </Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

      {logros && logros.total > 0 ? (
        <Pressable
          style={styles.achievementsCard}
          onPress={openAchievements}
          accessibilityRole="button"
          accessibilityLabel={t('home.achievementsSummary', {
            conseguidos: logros.conseguidos,
            total: logros.total,
          })}
        >
          <View style={styles.achievementsHeader}>
            <Text style={styles.achievementsTitle}>{t('home.myAchievements')}</Text>
            <Text style={styles.achievementsCount}>
              {t('home.achievementsSummary', {
                conseguidos: logros.conseguidos,
                total: logros.total,
              })}
            </Text>
          </View>
          <ProgressBar value={logros.conseguidos} max={logros.total} />
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
    actions: {
      gap: spacing.elementGap,
      marginTop: spacing.lg,
    },
  });
