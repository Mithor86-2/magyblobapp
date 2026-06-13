import { StyleSheet, Text, View } from 'react-native';
import type { Activity, Categoria } from '../../domain/types';
import { CATEGORIA_LABEL } from '../labels';
import { StarRating } from './StarRating';
import { AuthorBadge } from './AuthorBadge';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';

/** Color y emoji por categoría (borde de tarjeta según el design system). */
const CATEGORIA_STYLE: Record<Categoria, { color: string; emoji: string }> = {
  arte: { color: colors.primary, emoji: '🎨' },
  musica: { color: colors.secondary, emoji: '🎵' },
  logica: { color: colors.tertiary, emoji: '🧩' },
};

interface ActivityCardProps {
  activity: Activity;
  /** Si se pasa y la actividad no está completada, muestra estrellas para valorarla. */
  onComplete?: (valoracion: number) => void;
}

/** Tarjeta de actividad: emoji + categoría + título + descripción + progreso. */
export function ActivityCard({ activity, onComplete }: ActivityCardProps) {
  const estilo = CATEGORIA_STYLE[activity.categoria];
  const meta = [
    activity.duracionMin ? `${activity.duracionMin} min` : null,
    activity.nivel ? `Nivel ${activity.nivel}` : null,
  ].filter(Boolean);
  const completada = activity.valoracion != null;

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

      {completada ? (
        <View style={styles.progreso}>
          <Text style={styles.meta}>¡Hecha!</Text>
          <StarRating value={activity.valoracion ?? 0} />
        </View>
      ) : onComplete ? (
        <View style={styles.progreso}>
          <Text style={styles.meta}>¿Qué tal estuvo?</Text>
          <StarRating value={0} onChange={onComplete} />
        </View>
      ) : null}

      <AuthorBadge proveedor={activity.proveedor} />
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
  progreso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
