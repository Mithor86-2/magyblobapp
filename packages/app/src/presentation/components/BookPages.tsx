import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
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
  finImagen,
  onReachedEnd,
}: {
  paginas: string[];
  /** Nodo de portada (título + imagen); si se pasa, es la 1ª página del libro (US-83 #5). */
  portada?: ReactNode;
  /** Etiqueta de la última página ("¡Fin de la historia!"); si se pasa, se añade al final. */
  finLabel?: string;
  /** Imagen a mostrar también en la página final (portada del libro); opcional. */
  finImagen?: ReactNode;
  /**
   * Se llama **una sola vez**, la primera vez que el lector llega a la última página
   * (US-27, marcar como leído al terminar). Estable: envuélvelo en `useCallback`.
   */
  onReachedEnd?: () => void;
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

  // Al desmontar (p. ej. navegar atrás a mitad del giro de página), cancela cualquier
  // animación en vuelo: si no, su callback (`runOnJS` + reasignar `drag`) tocaría un nodo
  // ya destruido y en reanimated 4 / New Architecture puede provocar un crash NATIVO.
  useEffect(() => () => cancelAnimation(drag), [drag]);

  const enPrimera = indice <= 0;
  const enUltima = indice >= total - 1;

  // Avisa (una vez) al llegar a la última página: el lector ofrece marcar como leído
  // (US-27). El ref evita repetir el aviso si se navega hacia atrás y otra vez al final.
  const finAvisado = useRef(false);
  useEffect(() => {
    if (!finAvisado.current && indice >= total - 1) {
      finAvisado.current = true;
      onReachedEnd?.();
    }
  }, [indice, total, onReachedEnd]);

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

  // Alto FIJO de la hoja: TODAS las páginas del cuento miden igual (no crecen con el
  // texto), así el libro no cambia de tamaño al pasar página. Se acota para caber una
  // página de texto (paginarCuento ~60 palabras) en móvil; el texto se alinea arriba y
  // reserva el hueco del número de página, para que nada se solape ni se recorte.
  const pageHeight = Math.max(320, Math.min(460, Math.round(height * 0.52)));

  // Red de seguridad (US-97): calcula cuántas líneas de `bodyLg` caben de verdad en la
  // hoja (alto − padding vertical − hueco del número de página) y limita el texto a ese
  // número de líneas, además de encoger la fuente (`adjustsFontSizeToFit`). Así, aunque
  // el sistema use un tamaño de fuente accesible o aparezca una palabra muy larga, el
  // texto SIEMPRE cabe dentro de la hoja y la última línea nunca sale cortada.
  const lineHeightBody = typography.bodyLg.lineHeight ?? 30;
  const altoNumeroPagina = (typography.labelBold.lineHeight ?? 20) + spacing.sm;
  const altoTextoUtil = pageHeight - spacing.md * 2 - altoNumeroPagina;
  const maxLineasTexto = Math.max(1, Math.floor(altoTextoUtil / lineHeightBody));
  const item = itemsSeguro[indice] ?? itemsSeguro[0]!;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.page, { height: pageHeight }, hojaStyle]}>
          {item.tipo === 'portada' ? (
            <View style={styles.portada}>{portada}</View>
          ) : item.tipo === 'fin' ? (
            <View style={styles.fin}>
              {finImagen}
              {/* En una sola línea con las estrellas: encoge la fuente si no cabe. */}
              <Text style={styles.finText} numberOfLines={1} adjustsFontSizeToFit>
                {finLabel}
              </Text>
            </View>
          ) : (
            <View style={styles.texto}>
              <Text
                style={styles.body}
                accessibilityRole="text"
                numberOfLines={maxLineasTexto}
                adjustsFontSizeToFit
              >
                {item.texto}
              </Text>
            </View>
          )}
          {/* Número de página impreso en la hoja (US-91), como un libro real. */}
          <Text style={styles.numeroPagina} testID="page-number">
            {indice + 1}
          </Text>
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
      gap: spacing.md,
    },
    finText: {
      ...typography.headlineMd,
      color: '#1a1a1a',
      textAlign: 'center',
      // Ocupa el ancho de la hoja para que `adjustsFontSizeToFitWidth` acote y encoja a 1 línea.
      alignSelf: 'stretch',
    },
    // Página de texto: contenido alineado ARRIBA (US-97), no centrado, para que el
    // texto no invada el hueco del número de página ni se recorte por abajo cuando la
    // hoja es pequeña. `flex:1` reserva el espacio y el número de página queda debajo.
    texto: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    // Número de página impreso al pie de la hoja (US-91).
    numeroPagina: {
      ...typography.labelBold,
      color: '#8a8a8a',
      textAlign: 'center',
      marginTop: spacing.sm,
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
