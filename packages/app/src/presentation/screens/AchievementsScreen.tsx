import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Appear } from '../components/Appear';
import { BubblyButton } from '../components/BubblyButton';
import { CATEGORIAS_LOGRO } from '../../domain/types';
import type { Achievement, CategoriaLogro, Tema } from '../../domain/types';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { temaLabel } from '../labels';
import { useAppStore } from '../store/useAppStore';
import { useThemedStyles, useTheme } from '../theme/ThemeProvider';
import { type ColorTokens, makeSoftShadow, radius, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/** Clave i18n de la cabecera de cada categoría de logro. */
const CATEGORIA_LABEL: Record<CategoriaLogro, string> = {
  cuentos: 'achievements.catCuentos',
  actividades: 'achievements.catActividades',
  racha: 'achievements.catRacha',
  temas: 'achievements.catTemas',
};

/**
 * Pantalla **Mis logros** (US-68): muestra el catálogo de medallas del perfil activo
 * agrupado por categoría, con su progreso y estado (conseguido/bloqueado). Los datos
 * los sirve el backend (que reconcilia los desbloqueos); todo local, sin PII nueva.
 */
export function AchievementsScreen(_props: RootScreenProps<'Achievements'>) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const profile = useAppStore((s) => s.currentProfile);

  const [logros, setLogros] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      setLogros(await api.achievements.get(profile.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('achievements.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [profile, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const desbloqueados = logros.filter((l) => l.conseguido).length;

  /** Etiqueta legible del objetivo de un logro (según su categoría y meta). */
  const goalLabel = (l: Achievement): string => {
    switch (l.categoria) {
      case 'cuentos':
        return t('achievements.goalCuentos', { count: l.meta });
      case 'actividades':
        return t('achievements.goalActividades', { count: l.meta });
      case 'racha':
        return t('achievements.goalRacha', { count: l.meta });
      case 'temas':
        return t('achievements.goalTema', {
          tema: temaLabel(l.clave.replace('tema_', '') as Tema),
        });
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{t('achievements.title')}</Text>
      <Text style={styles.subtitle}>{t('achievements.subtitle')}</Text>

      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <BubblyButton label={t('common.retry')} onPress={() => void load()} variant="secondary" />
        </View>
      ) : null}

      {!loading && !error && logros.length === 0 ? (
        <Text style={styles.vacio}>{t('achievements.empty')}</Text>
      ) : null}

      {logros.length > 0 ? (
        <Text style={styles.summary}>
          {t('achievements.summary', { desbloqueados, total: logros.length })}
        </Text>
      ) : null}

      {CATEGORIAS_LOGRO.map((categoria) => {
        const delGrupo = logros.filter((l) => l.categoria === categoria);
        if (delGrupo.length === 0) return null;
        return (
          <View key={categoria} style={styles.grupo}>
            <Text style={styles.section}>{t(CATEGORIA_LABEL[categoria])}</Text>
            <View style={styles.grid}>
              {delGrupo.map((l, i) => (
                <Appear
                  key={l.clave}
                  delay={i * 40}
                  style={[styles.medal, l.conseguido ? styles.medalOn : styles.medalOff]}
                >
                  <View
                    accessibilityRole="text"
                    accessibilityLabel={`${goalLabel(l)} — ${
                      l.conseguido
                        ? t('achievements.unlocked')
                        : t('achievements.progress', { progreso: l.progreso, meta: l.meta })
                    }`}
                    style={styles.medalContent}
                  >
                    <Text style={styles.medalIcon}>{l.conseguido ? '🏆' : '🔒'}</Text>
                    <Text style={styles.medalLabel}>{goalLabel(l)}</Text>
                    <Text style={styles.medalProgress}>
                      {l.conseguido
                        ? t('achievements.unlocked')
                        : t('achievements.progress', { progreso: l.progreso, meta: l.meta })}
                    </Text>
                  </View>
                </Appear>
              ))}
            </View>
          </View>
        );
      })}
    </Screen>
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
    summary: {
      ...typography.labelBold,
      color: colors.primary,
    },
    vacio: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    grupo: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    section: {
      ...typography.headlineMd,
      color: colors.onSurface,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    medal: {
      width: '47%',
      borderRadius: radius.lg,
      padding: spacing.md,
      ...makeSoftShadow(colors),
    },
    medalContent: {
      gap: spacing.xs,
      alignItems: 'center',
    },
    medalOn: {
      backgroundColor: colors.primaryContainer,
    },
    medalOff: {
      backgroundColor: colors.surfaceContainer,
      opacity: 0.7,
    },
    medalIcon: {
      fontSize: 40,
    },
    medalLabel: {
      ...typography.labelBold,
      color: colors.onSurface,
      textAlign: 'center',
    },
    medalProgress: {
      ...typography.bodyMd,
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
  });
