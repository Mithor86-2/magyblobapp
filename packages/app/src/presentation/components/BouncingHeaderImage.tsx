import { useEffect } from 'react';
import { Image, type ImageSourcePropType, type StyleProp, type ImageStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useIsScreenActive } from '../hooks/useIsScreenActive';

/** Amplitud del rebote vertical (px a cada lado del centro) — sutil, no distractor. */
const AMPLITUD = 8;
/** Duración (ms) de media oscilación (subida o bajada). */
const DURACION_MS = 1600;

/**
 * Imagen de cabecera con un **rebote vertical en loop infinito** (US-86, ajuste #4):
 * se desplaza suavemente arriba↔abajo (`translateY` entre `-AMPLITUD` y `+AMPLITUD`)
 * con una curva `inOut` para que el movimiento sea tierno y continuo, como si flotara.
 *
 * La animación corre en el hilo de UI (reanimated). Es puramente decorativa: conserva
 * `resizeMode="contain"` y el rol de accesibilidad `image` de la cabecera original,
 * así que no cambia el layout ni la semántica. Bajo Vitest, reanimated está aliasado a
 * un stub inerte (la imagen se renderiza estática; el rebote se verifica a mano/E2E).
 */
export function BouncingHeaderImage({
  source,
  style,
  accessibilityLabel,
}: {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}) {
  const offset = useSharedValue(-AMPLITUD);
  // Pausa el bucle cuando la pantalla no está enfocada: en un tab navigator la vista
  // nativa se desacopla al desenfocar y animar sobre ella crashea (ver el hook).
  const activo = useIsScreenActive();

  useEffect(() => {
    if (!activo) {
      cancelAnimation(offset);
      return;
    }
    // Oscila indefinidamente entre -AMPLITUD y +AMPLITUD (reverse = true).
    offset.value = withRepeat(
      withTiming(AMPLITUD, { duration: DURACION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // Cancela el bucle al desmontar o al desenfocar: si no, la animación en vuelo
    // tocaría un nodo destruido/desacoplado y en reanimated 4 / New Arch crashea.
    return () => cancelAnimation(offset);
  }, [offset, activo]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Image
        source={source}
        style={style}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      />
    </Animated.View>
  );
}
