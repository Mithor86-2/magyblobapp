import { useEffect } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Giro leve a cada lado (grados) y rebote vertical (px) — movimiento tierno, no mareante. */
const GIRO_DEG = 6;
const REBOTE_PX = 4;
/** Duración (ms) de media oscilación. */
const DURACION_MS = 900;

/**
 * Avatar del niño (emoji de animal) con **movimiento suave en bucle** (US-90, ajuste #2):
 * gira levemente a un lado y otro y rebota un poco en vertical, como si moviera la cabeza.
 * Se usa en Inicio, en la cabecera de Cuentos y en el avatar seleccionado de `AvatarPicker`.
 *
 * La animación corre en el hilo de UI (reanimated). Es decorativa: envuelve el `Text` del
 * emoji en un `Animated.View` (bajo Vitest reanimated está aliasado a un stub inerte, así que
 * el emoji se renderiza estático y el movimiento se verifica a mano/E2E).
 */
export function AnimatedAvatar({
  emoji,
  style,
  accessibilityLabel,
}: {
  emoji: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    // Oscila 0↔1 en bucle; el estilo mapea eso a rotación (−GIRO…+GIRO) y rebote.
    t.value = withRepeat(
      withTiming(1, { duration: DURACION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [t]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -REBOTE_PX * t.value },
      { rotate: `${(t.value * 2 - 1) * GIRO_DEG}deg` },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={style} accessibilityLabel={accessibilityLabel}>
        {emoji}
      </Text>
    </Animated.View>
  );
}
