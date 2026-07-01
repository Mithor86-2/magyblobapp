import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { avatarEmoji } from '../components/AvatarPicker';
import type { ChildProfile } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { useAppStore } from '../store/useAppStore';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Selección del perfil activo entre los hijos del guardián (US-02). Carga la
 * lista al entrar; al elegir uno, lo fija como `currentProfile` y entra a las
 * pestañas. Si el guardián aún no tiene hijos, invita a crear el primero.
 */
export function SelectProfileScreen({ navigation }: RootScreenProps<'SelectProfile'>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const guardian = useAppStore((s) => s.guardian);
  const setProfile = useAppStore((s) => s.setProfile);
  // Lista de hijos en el store: fuente única para la pantalla y para el arranque (US-49).
  const profiles = useAppStore((s) => s.profiles);
  const setProfiles = useAppStore((s) => s.setProfiles);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!guardian) return;
    setLoading(true);
    setError(null);
    try {
      setProfiles(await api.profiles.list(guardian.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('selectProfile.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [guardian, setProfiles, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSelect(profile: ChildProfile) {
    setProfile(profile);
    navigation.replace('Main');
  }

  return (
    <Screen
      footer={
        <BubblyButton
          label={t('selectProfile.createNew')}
          onPress={() => navigation.navigate('CreateProfile')}
          variant={profiles.length === 0 ? 'primary' : 'secondary'}
        />
      }
    >
      <Text style={styles.title}>{t('selectProfile.title')}</Text>
      <Text style={styles.subtitle}>{t('selectProfile.subtitle')}</Text>

      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>{t('selectProfile.loading')}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.statusBox, styles.errorBox]}>
          <Text style={styles.errorText}>{error}</Text>
          <BubblyButton label={t('common.retry')} onPress={() => void load()} variant="secondary" />
        </View>
      ) : null}

      {!loading && !error && profiles.length === 0 ? (
        <Text style={styles.statusText}>{t('selectProfile.empty')}</Text>
      ) : null}

      {profiles.map((profile) => (
        <Pressable
          key={profile.id}
          style={styles.profileRow}
          onPress={() => onSelect(profile)}
          accessibilityRole="button"
          accessibilityLabel={t('selectProfile.chooseA11y', { nombre: profile.nombre })}
        >
          <Text style={styles.avatar}>{avatarEmoji(profile.avatar)}</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.nombre}</Text>
            <Text style={styles.profileMeta}>
              {t('selectProfile.years', { edad: profile.edad })}
            </Text>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    title: {
      ...typography.displayLg,
      color: colors.primary,
    },
    subtitle: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
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
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.secondaryContainer,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    avatar: {
      fontSize: 48,
    },
    profileInfo: {
      flex: 1,
      gap: 2,
    },
    profileName: {
      ...typography.headlineMd,
      color: colors.onSurface,
    },
    profileMeta: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
  });
