import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Activity } from '../../domain/types';
import { categoriaLabel } from '../labels';
import { vocabColor } from '../vocabColor';
import { formatearFecha } from '../formatFecha';
import { DEFAULT_APP_LANGUAGE, esIdiomaApp } from '../../i18n';
import { Appear } from './Appear';
import { StarRating } from './StarRating';
import { AuthorBadge } from './AuthorBadge';
import { BubblyButton } from './BubblyButton';
import { FavoriteButton } from './FavoriteButton';
import { Icon } from './Icon';
import { api } from '../../composition';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, makeSoftShadow, radius, spacing, typography } from '../theme/tokens';

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
  /**
   * Si se pasa, la tarjeta permite completar la actividad: "Realizado" la marca al
   * instante (US-72) llamando `onComplete()` sin valoración, y una vez hecha las
   * estrellas quedan editables para puntuar (o cambiar la puntuación) con `onComplete(n)`.
   */
  onComplete?: (valoracion?: number) => void;
  /**
   * Si los pasos arrancan visibles (US-81 ajuste). Por defecto `false` (plegados, con
   * "Ver pasos") en Historial/Búsqueda; el generador de actividades lo pasa `true` para
   * que las actividades recién generadas muestren el paso a paso de inmediato.
   */
  pasosVisiblesInicial?: boolean;
  /**
   * Modo **compacto** (Historial, US-100): la tarjeta queda corta —cabecera, título, autor
   * y fecha— y todo el **detalle** (descripción, pasos, duración/nivel y valoración) se
   * oculta tras un botón **"Ver más"**, para igualar el tamaño a las tarjetas de cuento.
   */
  compact?: boolean;
}

/** Tarjeta de actividad: emoji + categoría + título + descripción + progreso. */
export function ActivityCard({
  activity,
  onComplete,
  pasosVisiblesInicial = false,
  compact = false,
}: ActivityCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // US-81: los pasos se pliegan/despliegan; arrancan según `pasosVisiblesInicial`.
  const [mostrarPasos, setMostrarPasos] = useState(pasosVisiblesInicial);
  // Modo compacto (US-100): el detalle completo se muestra/oculta con "Ver más".
  const [expandido, setExpandido] = useState(false);
  // Color por valor de categoría (US-100): borde de tarjeta, icono, badge y la acción
  // ("Ver pasos"/"Ver más") comparten el mismo color; `on` es el texto legible encima.
  const { color, on } = vocabColor(colors, activity.categoria);
  const meta = [
    activity.duracionMin ? t('activityCard.minutes', { min: activity.duracionMin }) : null,
    activity.nivel ? t('activityCard.level', { nivel: activity.nivel }) : null,
  ].filter(Boolean);
  // "Hecha" se define por `completadaEn` (coherente con los logros del backend), no por
  // la valoración: una actividad puede estar hecha y sin puntuar (US-72).
  const completada = activity.completadaEn != null;
  // Fecha de generación localizada (US-62); ausente o inválida ⇒ no se muestra.
  const idioma = esIdiomaApp(i18n.language) ? i18n.language : DEFAULT_APP_LANGUAGE;
  const fecha = formatearFecha(activity.creadoEn, idioma);

  // En modo compacto el detalle solo se ve al expandir; si no, siempre.
  const detalleVisible = !compact || expandido;

  const detalle = (
    <>
      <Text style={styles.descripcion}>{activity.descripcion}</Text>
      {activity.instrucciones ? (
        <View style={styles.instrucciones}>
          {/* En compacto los pasos ya cuelgan de "Ver más", así que se muestran directos;
              fuera de compacto conservan su propio botón "Ver pasos" (US-81). */}
          {compact ? null : (
            <Pressable
              onPress={() => setMostrarPasos((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: mostrarPasos }}
              style={styles.pasosToggle}
            >
              <Text style={[styles.pasosToggleText, { color }]}>
                {mostrarPasos ? t('activityCard.hideSteps') : t('activityCard.showSteps')}
              </Text>
            </Pressable>
          )}
          {compact || mostrarPasos
            ? pasosDeInstrucciones(activity.instrucciones).map((paso, i) => (
                <View key={i} style={styles.pasoFila}>
                  <Text style={styles.pasoNum}>{i + 1}.</Text>
                  <Text style={styles.instruccionesTexto}>{paso}</Text>
                </View>
              ))
            : null}
        </View>
      ) : null}
      {meta.length > 0 ? <Text style={styles.meta}>{meta.join(' · ')}</Text> : null}
    </>
  );

  // Bloque de progreso (US-72): hecha ⇒ "¡Hecha!"/valoración con estrellas; pendiente y
  // con `onComplete` ⇒ botón "Realizado". Va fuera de `detalle` para verse también en
  // compacto sin desplegar "Ver más" (US-10: marcar realizado desde el Historial).
  const progreso = completada ? (
    <View style={styles.progreso}>
      {/* Hecha pero aún sin puntuar y editable ⇒ invita a valorar; ya puntuada ⇒ "¡Hecha!". */}
      <Text style={styles.meta}>
        {activity.valoracion == null && onComplete
          ? t('activityCard.howWasIt')
          : t('activityCard.done')}
      </Text>
      <StarRating value={activity.valoracion ?? 0} onChange={onComplete} />
    </View>
  ) : onComplete ? (
    <BubblyButton
      label={t('activityCard.markDone')}
      onPress={() => onComplete()}
      variant="accent"
    />
  ) : null;

  return (
    <Appear style={[styles.card, { borderBottomColor: color }]}>
      <View style={styles.header}>
        <Icon name={`cat-${activity.categoria}`} size="lg" color={color} />
        <View style={styles.headerRight}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={[styles.badgeText, { color: on }]}>
              {categoriaLabel(activity.categoria)}
            </Text>
          </View>
          <FavoriteButton
            favorito={activity.favorito}
            onToggle={(favorito) => api.activities.setFavorite(activity.id, favorito)}
          />
        </View>
      </View>
      <Text style={styles.titulo}>{activity.titulo}</Text>
      {detalleVisible ? detalle : null}
      {progreso}

      <AuthorBadge proveedor={activity.proveedor} />
      {fecha ? <Text style={styles.fecha}>{t('common.generatedOn', { fecha })}</Text> : null}

      {/* US-100: en el historial la tarjeta es compacta; "Ver más" despliega el detalle.
          El botón usa el color de la categoría (== borde de la tarjeta). */}
      {compact ? (
        <BubblyButton
          label={expandido ? t('activityCard.showLess') : t('activityCard.showMore')}
          color={color}
          on={on}
          onPress={() => setExpandido((v) => !v)}
        />
      ) : null}
    </Appear>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.lg,
      borderBottomWidth: 4,
      padding: spacing.md,
      gap: spacing.xs,
      ...makeSoftShadow(colors),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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
    pasosToggle: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
    pasosToggleText: {
      ...typography.labelBold,
      color: colors.primary,
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
