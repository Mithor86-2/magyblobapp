import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { Icon } from '../components/Icon';
import { avatarEmoji } from '../components/AvatarPicker';
import { useAppStore } from '../store/useAppStore';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';
import type { RootStackParamList, TabScreenProps } from '../navigation';

/** Pantalla de bienvenida: saluda al niño actual y lleva a Cuentos / Actividades. */
export function HomeScreen({ navigation }: TabScreenProps<'Inicio'>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const profile = useAppStore((s) => s.currentProfile);

  // La zona de adultos vive en el stack raíz (sobre las pestañas), tras la puerta parental.
  const openParental = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Parental');

  // La vitrina de logros (US-68) también vive en el stack raíz, sobre las pestañas.
  const openAchievements = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Achievements');

  return (
    <Screen headerImageName="home">
      <View style={styles.hero}>
        <Text style={styles.avatar}>{profile ? avatarEmoji(profile.avatar) : '✨'}</Text>
        <Text style={styles.title}>
          {t('home.greeting', { nombre: profile ? `, ${profile.nombre}` : '' })}
        </Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

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

      <Pressable
        style={styles.adultLink}
        onPress={openParental}
        accessibilityRole="button"
        accessibilityLabel={t('home.adultsZone')}
      >
        <Icon name="adults" size="sm" color={colors.onSurfaceVariant} />
        <Text style={styles.adultLinkText}>{t('home.adultsZone')}</Text>
      </Pressable>
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
    actions: {
      gap: spacing.elementGap,
      marginTop: spacing.lg,
    },
    adultLink: {
      marginTop: spacing.lg,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    adultLinkText: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
  });
