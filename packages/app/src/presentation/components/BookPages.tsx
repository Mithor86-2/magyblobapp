import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';

/** Duración (ms) de cada media fase del giro (salida / entrada). */
const FASE_MS = 180;
/** Umbral de arrastre (px) para considerar que se pasa de página al soltar. */
const UMBRAL = 60;

/**
 * Lector **paginado como un libro** (A2/US-73, US-74, US-79): muestra una sola página
 * del cuento a la vez y permite pasar página **arrastrando** (page-curl) o con los
 * controles ‹ / › (deshabilitados en los extremos), con el indicador "Página n de
 * total". El texto se paginó antes con `paginarCuento` (lógica pura); este componente
 * solo presenta y navega.
 *
 * **Giro de hoja con reanimated + gesture-handler (US-79).** Un único valor compartido
 * `drag` (en el hilo de UI) controla el giro: durante el arrastre sigue al dedo
 * (`rotateY` + `perspective` + traslación) y, al soltar o pulsar ‹/›, se anima en dos
 * medias fases —la hoja actual gira hacia el canto, se cambia el índice y la nueva
 * entra desde el lado opuesto— de modo que **tanto el gesto como los botones** muestran
 * el mismo pase de página. El índice es estado de React (los botones/gesto comparten
 * `irA`), así que los tests pueden ejercitar la navegación sin el hilo nativo.
 *
 * **Hoja de tamaño consistente (US-79).** Alto mínimo proporcional a la pantalla para
 * que todas las páginas se vean igual, sobre papel blanco literal (`#ffffff`)
 * independiente del tema; los controles usan tokens de tema.
 */
export function BookPages({ paginas }: { paginas: string[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { width, height } = useWindowDimensions();

  const total = Math.max(paginas.length, 1);
  const [indice, setIndice] = useState(0);
  // Giro/arrastre de la hoja (hilo de UI): 0 = asentada; ±width = de canto.
  const drag = useSharedValue(0);

  const enPrimera = indice <= 0;
  const enUltima = indice >= total - 1;

  // Cambia el índice (estado React). Lo llama el callback del giro vía runOnJS.
  const cambiarIndice = useCallback((siguiente: number) => setIndice(siguiente), []);

  // Anima el pase de página en dos medias fases (salida → cambio → entrada). La
  // dirección fija el sentido del giro. Lo usan los botones ‹/› y el fin del gesto.
  const irA = useCallback(
    (siguiente: number) => {
      if (siguiente < 0 || siguiente > total - 1 || siguiente === indice) return;
      const dir = siguiente > indice ? 1 : -1; // avanzar (+1) / retroceder (-1)
      // Fase 1: la hoja actual gira hasta el canto (avanzar → hacia la izquierda).
      drag.value = withTiming(-dir * width, { duration: FASE_MS }, (fin) => {
        if (!fin) return;
        runOnJS(cambiarIndice)(siguiente);
        // Fase 2: la nueva hoja entra desde el lado opuesto hasta asentarse.
        drag.value = dir * width;
        drag.value = withTiming(0, { duration: FASE_MS });
      });
    },
    [indice, total, width, drag, cambiarIndice],
  );

  // Arrastre horizontal: sigue al dedo y, al soltar, pasa de página si supera el umbral.
  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      drag.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX <= -UMBRAL && indice < total - 1) {
        runOnJS(irA)(indice + 1);
      } else if (e.translationX >= UMBRAL && indice > 0) {
        runOnJS(irA)(indice - 1);
      } else {
        drag.value = withSpring(0);
      }
    });

  // La hoja gira sobre rotateY con perspectiva, se desplaza y se encoge un poco al
  // levantarse (efecto de pliegue), siguiendo `drag`.
  const hojaStyle = useAnimatedStyle(() => {
    const rot = interpolate(drag.value, [-width, 0, width], [-60, 0, 60], Extrapolation.CLAMP);
    const escala = interpolate(Math.abs(drag.value), [0, width], [1, 0.9], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: 1000 },
        { translateX: drag.value * 0.28 },
        { rotateY: `${rot}deg` },
        { scale: escala },
      ],
    };
  });

  // Sombra del pliegue: oscurece el canto hacia el que gira la hoja (izquierda al
  // avanzar, derecha al retroceder) y se intensifica con el arrastre, simulando el
  // relieve de una página que se levanta (aproximación de page-curl sin Skia).
  const sombraStyle = useAnimatedStyle(() => {
    const t = interpolate(Math.abs(drag.value), [0, width], [0, 0.55], Extrapolation.CLAMP);
    // Al avanzar (drag<0) la sombra cae a la izquierda; al retroceder, a la derecha.
    const haciaIzquierda = drag.value < 0;
    return {
      opacity: t,
      left: haciaIzquierda ? 0 : undefined,
      right: haciaIzquierda ? undefined : 0,
    };
  });

  // Alto mínimo proporcional acotado: páginas de tamaño consistente sin recortar texto.
  const pageMinHeight = Math.max(240, Math.min(420, Math.round(height * 0.42)));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.page, { minHeight: pageMinHeight }, hojaStyle]}>
          <Text style={styles.body} accessibilityRole="text">
            {paginas[indice] ?? ''}
          </Text>
          {/* Sombra del pliegue (aproximación de curl): banda oscura en el canto que gira. */}
          <Animated.View pointerEvents="none" style={[styles.sombraPliegue, sombraStyle]} />
        </Animated.View>
      </GestureDetector>

      <View style={styles.controls}>
        <Pressable
          onPress={() => irA(indice - 1)}
          disabled={enPrimera}
          accessibilityRole="button"
          accessibilityLabel={t('reader.prevPage')}
          accessibilityState={{ disabled: enPrimera }}
          style={[styles.arrow, enPrimera && styles.arrowDisabled]}
        >
          <Text style={[styles.arrowText, enPrimera && styles.arrowTextDisabled]}>‹</Text>
        </Pressable>

        <Text style={styles.indicator}>{t('reader.page', { n: indice + 1, total })}</Text>

        <Pressable
          onPress={() => irA(indice + 1)}
          disabled={enUltima}
          accessibilityRole="button"
          accessibilityLabel={t('reader.nextPage')}
          accessibilityState={{ disabled: enUltima }}
          style={[styles.arrow, enUltima && styles.arrowDisabled]}
        >
          <Text style={[styles.arrowText, enUltima && styles.arrowTextDisabled]}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    // Hoja tipo papel: blanco literal (independiente del tema) con sombra/borde suave.
    page: {
      backgroundColor: '#ffffff',
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    body: {
      ...typography.bodyLg,
      // Texto oscuro fijo para contrastar sobre la hoja blanca en cualquier tema.
      color: '#1a1a1a',
    },
    // Banda de sombra del pliegue: ~40% del ancho pegada a un canto, esquinas del papel.
    sombraPliegue: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '40%',
      backgroundColor: '#000000',
      borderRadius: radius.md,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    arrow: {
      backgroundColor: colors.secondaryContainer,
      borderRadius: radius.pill,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowDisabled: {
      opacity: 0.4,
    },
    arrowText: {
      ...typography.headlineMd,
      color: colors.onSurface,
      lineHeight: 28,
    },
    arrowTextDisabled: {
      color: colors.onSurfaceVariant,
    },
    indicator: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
  });
