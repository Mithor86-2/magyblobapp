import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Activity, Categoria } from '../../domain/types';
import { categoriaLabel } from '../labels';
import { formatearFecha } from '../formatFecha';
import { DEFAULT_APP_LANGUAGE, esIdiomaApp } from '../../i18n';
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

/**
 * Parte las instrucciones (texto con pasos "1. … 2. … 3. …" o por líneas) en una
 * lista de pasos, sin el marcador numérico (la UI los renumera). Exportada para tests.
 */
export function pasosDeInstrucciones(texto: string): string[] {
  const porNumero = texto
    .split(/\s*(?=\d+[.)]\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const base =
    porNumero.length > 1
      ? porNumero
      : texto
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
  return base.map((s) => s.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean);
}

interface ActivityCardProps {
  activity: Activity;
  /** Si se pasa y la actividad no está completada, muestra estrellas para valorarla. */
  onComplete?: (valoracion: number) => void;
}

/** Tarjeta de actividad: emoji + categoría + título + descripción + progreso. */
export function ActivityCard({ activity, onComplete }: ActivityCardProps) {
  const { t, i18n } = useTranslation();
  // Flujo del botón "Realizado" (US-10 ampliada): pedir la valoración al pulsarlo.
  const [valorando, setValorando] = useState(false);
  const color = CATEGORIA_COLOR[activity.categoria];
  const meta = [
    activity.duracionMin ? t('activityCard.minutes', { min: activity.duracionMin }) : null,
    activity.nivel ? t('activityCard.level', { nivel: activity.nivel }) : null,
  ].filter(Boolean);
  const completada = activity.valoracion != null;
  // Fecha de generación localizada (US-62); ausente o inválida ⇒ no se muestra.
  const idioma = esIdiomaApp(i18n.language) ? i18n.language : DEFAULT_APP_LANGUAGE;
  const fecha = formatearFecha(activity.creadoEn, idioma);

  return (
    <View style={[styles.card, { borderBottomColor: color }]}>
      <View style={styles.header}>
        <Icon name={`cat-${activity.categoria}`} size="lg" color={color} />
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{categoriaLabel(activity.categoria)}</Text>
        </View>
      </View>
      <Text style={styles.titulo}>{activity.titulo}</Text>
      <Text style={styles.descripcion}>{activity.descripcion}</Text>
      {activity.instrucciones ? (
        <View style={styles.instrucciones}>
          <Text style={styles.instruccionesTitulo}>{t('activityCard.howTo')}</Text>
          {pasosDeInstrucciones(activity.instrucciones).map((paso, i) => (
            <View key={i} style={styles.pasoFila}>
              <Text style={styles.pasoNum}>{i + 1}.</Text>
              <Text style={styles.instruccionesTexto}>{paso}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {meta.length > 0 ? <Text style={styles.meta}>{meta.join(' · ')}</Text> : null}

      {completada ? (
        <View style={styles.progreso}>
          <Text style={styles.meta}>{t('activityCard.done')}</Text>
          <StarRating value={activity.valoracion ?? 0} />
        </View>
      ) : onComplete ? (
        valorando ? (
          <View style={styles.progreso}>
            <Text style={styles.meta}>{t('activityCard.howWasIt')}</Text>
            <StarRating value={0} onChange={onComplete} />
          </View>
        ) : (
          <BubblyButton
            label={t('activityCard.markDone')}
            onPress={() => setValorando(true)}
            variant="accent"
          />
        )
      ) : null}

      <AuthorBadge proveedor={activity.proveedor} />
      {fecha ? <Text style={styles.fecha}>{t('common.generatedOn', { fecha })}</Text> : null}
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
  pasoFila: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pasoNum: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  instruccionesTexto: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  meta: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
  },
  fecha: {
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
