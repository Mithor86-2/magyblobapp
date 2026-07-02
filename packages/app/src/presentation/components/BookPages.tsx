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
} from 'react-native-reanimated';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';

/**
 * Lector **paginado como un libro** (A2/US-73, US-74, US-79): muestra una sola página
 * del cuento a la vez y permite pasar página **arrastrando** (page-curl) o con los
 * controles ‹ / › (deshabilitados en los extremos), con el indicador "Página n de
 * total". El texto se paginó antes con `paginarCuento` (lógica pura); este componente
 * solo presenta y navega.
 *
 * **Arrastre con giro 3D (US-79).** El gesto horizontal lo maneja
 * `react-native-gesture-handler` y la animación corre en el hilo de UI con
 * `react-native-reanimated`: mientras se arrastra, la hoja gira sobre `rotateY` (con
 * `perspective`) siguiendo el dedo; al soltar, si se superó el umbral se pasa de página
 * (avanzar/retroceder según el sentido) y si no, la hoja vuelve a su sitio con un
 * muelle. El índice de página es estado de React, así que los botones ‹/› y el gesto
 * comparten la misma navegación y los tests pueden ejercitarla sin el hilo nativo.
 *
 * **Hoja de tamaño consistente (US-79).** La hoja tiene un alto mínimo proporcional a
 * la pantalla para que todas las páginas se vean del mismo tamaño (sin el salto entre
 * páginas cortas y largas), pintada sobre papel blanco literal (`#ffffff`) e
 * independiente del tema (claro u oscuro); los controles siguen usando tokens de tema.
 *
 * Accesible: los botones llevan `accessibilityLabel` localizable (reader.prevPage /
 * reader.nextPage) y el cuerpo es texto legible por lector de pantalla.
 */
export function BookPages({ paginas }: { paginas: string[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { width, height } = useWindowDimensions();

  const total = Math.max(paginas.length, 1);
  const [indice, setIndice] = useState(0);
  // Desplazamiento horizontal del arrastre (hilo de UI); 0 = hoja asentada.
  const dragX = useSharedValue(0);

  const enPrimera = indice <= 0;
  const enUltima = indice >= total - 1;

  // Cambia de página (estado React) y reasienta la hoja. Lo comparten botones y gesto.
  const irA = useCallback(
    (siguiente: number) => {
      if (siguiente < 0 || siguiente > total - 1 || siguiente === indice) return;
      setIndice(siguiente);
      dragX.value = 0;
    },
    [indice, total, dragX],
  );

  // Gesto de arrastre: sigue el dedo y, al soltar, pasa de página si se supera el umbral.
  const UMBRAL = 60;
  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      dragX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX <= -UMBRAL && indice < total - 1) {
        runOnJS(irA)(indice + 1);
      } else if (e.translationX >= UMBRAL && indice > 0) {
        runOnJS(irA)(indice - 1);
      } else {
        dragX.value = withSpring(0);
      }
    });

  // La hoja gira sobre rotateY siguiendo el arrastre (page-curl) con perspectiva.
  const hojaStyle = useAnimatedStyle(() => {
    const rot = interpolate(dragX.value, [-width, 0, width], [45, 0, -45], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rot}deg` },
        { translateX: dragX.value * 0.15 },
      ],
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
