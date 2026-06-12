import { StyleSheet, Text, View } from 'react-native';
import type { Activity, Categoria } from '../../domain/types';
import { CATEGORIA_LABEL } from '../labels';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';

/** Color y emoji por categoría (borde de tarjeta según el design system). */
const CATEGORIA_STYLE: Record<Categoria, { color: string; emoji: string }> = {
  arte: { color: colors.primary, emoji: '🎨' },
  musica: { color: colors.secondary, emoji: '🎵' },
  logica: { color: colors.tertiary, emoji: '🧩' },
};

/** Tarjeta de una actividad recomendada: emoji + categoría + título + descripción. */
export function ActivityCard({ activity }: { activity: Activity }) {
  const estilo = CATEGORIA_STYLE[activity.categoria];
  const meta = [
    activity.duracionMin ? `${activity.duracionMin} min` : null,
    activity.nivel ? `Nivel ${activity.nivel}` : null,
  ].filter(Boolean);

  return (
    <View style={[styles.card, { borderBottomColor: estilo.color }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{estilo.emoji}</Text>
        <View style={[styles.badge, { backgroundColor: estilo.color }]}>
          <Text style={styles.badgeText}>{CATEGORIA_LABEL[activity.categoria]}</Text>
        </View>
      </View>
      <Text style={styles.titulo}>{activity.titulo}</Text>
      <Text style={styles.descripcion}>{activity.descripcion}</Text>
      {meta.length > 0 ? <Text style={styles.meta}>{meta.join(' · ')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    borderBottomWidth: 4,
    padding: spacing.md,
    gap: spacing.xs,
    ...softShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 40,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    ...typography.labelBold,
    color: colors.onPrimary,
  },
  titulo: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  descripcion: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  meta: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
  },
});
