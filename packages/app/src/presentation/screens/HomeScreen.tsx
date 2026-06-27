import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { Icon } from '../components/Icon';
import { avatarEmoji } from '../components/AvatarPicker';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, typography } from '../theme/tokens';
import type { RootStackParamList, TabScreenProps } from '../navigation';

/** Pantalla de bienvenida: saluda al niño actual y lleva a Cuentos / Actividades. */
export function HomeScreen({ navigation }: TabScreenProps<'Inicio'>) {
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.currentProfile);

  // La zona de adultos vive en el stack raíz (sobre las pestañas), tras la puerta parental.
  const openParental = () =>
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Parental');

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

const styles = StyleSheet.create({
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
