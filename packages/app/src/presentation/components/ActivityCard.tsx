import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Activity, Categoria } from '../../domain/types';
import { CATEGORIA_LABEL } from '../labels';
import { StarRating } from './StarRating';
import { AuthorBadge } from './AuthorBadge';
import { BubblyButton } from './BubblyButton';
import { Icon } from './Icon';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';

/** Color por categoría (borde de tarjeta e icono según el design system). */
const CATEGORIA_COLOR: Record<Categoria, string> = {
  arte: colors.primary,
  musica: colors.secondary,
  logica: colors.tertiary,
};

interface ActivityCardProps {
  activity: Activity;
  /** Si se pasa y la actividad no está completada, muestra estrellas para valorarla. */
  onComplete?: (valoracion: number) => void;
}

/** Tarjeta de actividad: emoji + categoría + título + descripción + progreso. */
export function ActivityCard({ activity, onComplete }: ActivityCardProps) {
  // Flujo del botón "Realizado" (US-10 ampliada): pedir la valoración al pulsarlo.
  const [valorando, setValorando] = useState(false);
  const color = CATEGORIA_COLOR[activity.categoria];
  const meta = [
    activity.duracionMin ? `${activity.duracionMin} min` : null,
    activity.nivel ? `Nivel ${activity.nivel}` : null,
  ].filter(Boolean);
  const completada = activity.valoracion != null;

  return (
    <View style={[styles.card, { borderBottomColor: color }]}>
      <View style={styles.header}>
        <Icon name={`cat-${activity.categoria}`} size="lg" color={color} />
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{CATEGORIA_LABEL[activity.categoria]}</Text>
        </View>
      </View>
      <Text style={styles.titulo}>{activity.titulo}</Text>
      <Text style={styles.descripcion}>{activity.descripcion}</Text>
      {activity.instrucciones ? (
        <View style={styles.instrucciones}>
          <Text style={styles.instruccionesTitulo}>Cómo hacerlo</Text>
          <Text style={styles.instruccionesTexto}>{activity.instrucciones}</Text>
        </View>
      ) : null}
      {meta.length > 0 ? <Text style={styles.meta}>{meta.join(' · ')}</Text> : null}

      {completada ? (
        <View style={styles.progreso}>
          <Text style={styles.meta}>¡Hecha!</Text>
          <StarRating value={activity.valoracion ?? 0} />
        </View>
      ) : onComplete ? (
        valorando ? (
          <View style={styles.progreso}>
            <Text style={styles.meta}>¿Qué tal estuvo?</Text>
            <StarRating value={0} onChange={onComplete} />
          </View>
        ) : (
          <BubblyButton label="Realizado" onPress={() => setValorando(true)} variant="accent" />
        )
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
  instrucciones: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  instruccionesTitulo: {
    ...typography.labelBold,
    color: colors.onSurface,
  },
  instruccionesTexto: {
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
