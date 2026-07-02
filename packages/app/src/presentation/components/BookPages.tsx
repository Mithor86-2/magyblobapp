import { useCallback, useState, type ReactNode } from 'react';
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
 * Lector **paginado como un libro** (US-73/US-74/US-79/US-83): muestra una página a la vez
 * y permite pasar página **arrastrando** (efecto de pliegue/page-curl) o con los controles
 * ‹ / › (deshabilitados en los extremos), con el indicador "Página n de total".
 *
 * **Estructura de libro (US-83 #5):** una **portada** opcional (1ª página: título + imagen),
 * las **páginas de texto** (`paginas`, ya troceadas por `paginarCuento`) y una **página final
 * "FIN"** opcional (`finLabel`).
 *
 * **Giro de hoja con reanimated + gesture-handler.** Un valor compartido `drag` controla el
 * giro (`rotateY` + `perspective` + traslación + escala) siguiendo el dedo; al soltar o pulsar
 * ‹/› se anima en dos medias fases (la hoja actual gira hacia el canto, se cambia el índice y
 * la nueva entra desde el lado opuesto). El índice es estado de React, así que los botones/gesto
 * comparten `irA` y los tests ejercitan la navegación sin el hilo nativo.
 *
 * _Nota (US-83): se evaluó `react-native-page-flipper` para un curl "real", pero su versión
 * publicada (1.0.1) crashea con Reanimated 4 / New Architecture ("undefined is not a function"
 * en `BookPagePortrait`), así que se mantiene el pliegue con reanimated. Ver `Docs/memory.md`._
 */
type ItemLibro = { tipo: 'portada' } | { tipo: 'texto'; texto: string } | { tipo: 'fin' };

export function BookPages({
  paginas,
  portada,
  finLabel,
}: {
  paginas: string[];
  /** Nodo de portada (título + imagen); si se pasa, es la 1ª página del libro (US-83 #5). */
  portada?: ReactNode;
  /** Etiqueta de la última página ("FIN"); si se pasa, se añade al final (US-83 #5). */
  finLabel?: string;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { width, height } = useWindowDimensions();

  // Ítems del libro: portada (opcional) → páginas de texto → FIN (opcional).
  const items: ItemLibro[] = [
    ...(portada ? [{ tipo: 'portada' } as const] : []),
    ...paginas.map((texto) => ({ tipo: 'texto', texto }) as const),
    ...(finLabel ? [{ tipo: 'fin' } as const] : []),
  ];
  // Sin contenido: una página en blanco (indicador "1/1").
  const itemsSeguro: ItemLibro[] = items.length > 0 ? items : [{ tipo: 'texto', texto: '' }];
  const total = itemsSeguro.length;

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
      drag.value = withTiming(-dir * width, { duration: FASE_MS }, (fin) => {
        if (!fin) return;
        runOnJS(cambiarIndice)(siguiente);
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

  // Alto mínimo proporcional acotado: páginas de tamaño consistente sin recortar texto.
  const pageMinHeight = Math.max(240, Math.min(420, Math.round(height * 0.42)));
  const item = itemsSeguro[indice] ?? itemsSeguro[0]!;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.page, { minHeight: pageMinHeight }, hojaStyle]}>
          {item.tipo === 'portada' ? (
            <View style={styles.portada}>{portada}</View>
          ) : item.tipo === 'fin' ? (
            <View style={styles.fin}>
              <Text style={styles.finText}>{finLabel}</Text>
            </View>
          ) : (
            <Text style={styles.body} accessibilityRole="text">
              {item.texto}
            </Text>
          )}
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
    // Hoja tipo papel: blanco literal (independiente del tema) con un borde suave. Sin
    // sombras (ni de pliegue ni de elevación): solo el giro de la hoja al pasar página.
    page: {
      backgroundColor: '#ffffff',
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    portada: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    fin: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    finText: {
      ...typography.displayLg,
      color: '#1a1a1a',
      letterSpacing: 2,
    },
    body: {
      ...typography.bodyLg,
      // Texto oscuro fijo para contrastar sobre la hoja blanca en cualquier tema.
      color: '#1a1a1a',
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
