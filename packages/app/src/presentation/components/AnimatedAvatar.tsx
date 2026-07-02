import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Rebote vertical (px) y giro leve a cada lado (grados) — movimiento tierno. */
const REBOTE_PX = 5;
const GIRO_DEG = 8;
/** Duraciones (ms) de la secuencia (US-90): rebote 3s, giros 0.5s, pausas 1s. */
const REBOTE_MS = 3000;
const GIRO_MS = 500;
const PAUSA_MS = 1000;
/** Ciclos del rebote dentro de los 3s (8 × 375 ms = 3000 ms, número par → acaba centrado). */
const REBOTE_CICLOS = 8;
/** Descanso del rebote = resto del ciclo mientras giran/pausan (para sincronizar ambos loops). */
const REBOTE_DESCANSO_MS = PAUSA_MS + GIRO_MS + PAUSA_MS + GIRO_MS + PAUSA_MS + GIRO_MS; // 4500

/** Nº de estrellas del estallido al tocar y su distancia de salida (px). */
const ESTRELLAS = 8;
const ESTRELLA_DIST = 46;
const ESTALLIDO_MS = 700;

/**
 * Avatar del niño (emoji de animal) con **animación por fases en bucle** (US-90, ajuste #2):
 * rebota suave ~3s, pausa 1s, gira levemente a la derecha, pausa 1s, gira a la izquierda,
 * pausa 1s, y vuelve a empezar. Al **tocarlo** (`interactive`), lanza un **estallido de
 * estrellas** que salen y se desvanecen.
 *
 * Corre en el hilo de UI (reanimated). Bajo Vitest reanimated está aliasado a un stub inerte
 * (el emoji se renderiza estático; el movimiento y el estallido se verifican a mano/E2E).
 */
export function AnimatedAvatar({
  emoji,
  style,
  accessibilityLabel,
  interactive = false,
}: {
  emoji: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  /** Si es `true`, el avatar es pulsable y al tocarlo lanza el estallido de estrellas. */
  interactive?: boolean;
}) {
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  // Cada toque remonta el estallido (key incremental) para reiniciar su animación.
  const [estallido, setEstallido] = useState(0);

  useEffect(() => {
    // Rebote 3s → (descanso mientras giran/pausan), en bucle.
    ty.value = withRepeat(
      withSequence(
        withRepeat(
          withTiming(-REBOTE_PX, {
            duration: REBOTE_MS / REBOTE_CICLOS,
            easing: Easing.inOut(Easing.ease),
          }),
          REBOTE_CICLOS,
          true,
        ),
        withTiming(0, { duration: 1 }),
        withDelay(REBOTE_DESCANSO_MS - 1, withTiming(0, { duration: 1 })),
      ),
      -1,
    );
    // Giro: quieto durante rebote+pausa1 → derecha → pausa → izquierda → pausa → centro.
    rot.value = withRepeat(
      withSequence(
        withDelay(REBOTE_MS + PAUSA_MS, withTiming(0, { duration: 1 })),
        withTiming(GIRO_DEG, { duration: GIRO_MS, easing: Easing.inOut(Easing.ease) }),
        withDelay(PAUSA_MS, withTiming(GIRO_DEG, { duration: 1 })),
        withTiming(-GIRO_DEG, { duration: GIRO_MS, easing: Easing.inOut(Easing.ease) }),
        withDelay(PAUSA_MS, withTiming(-GIRO_DEG, { duration: 1 })),
        withTiming(0, { duration: GIRO_MS, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [ty, rot]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
  }));

  const avatar = (
    <Animated.View style={animatedStyle}>
      <Text style={style} accessibilityLabel={accessibilityLabel}>
        {emoji}
      </Text>
    </Animated.View>
  );

  if (!interactive) return avatar;

  return (
    <Pressable
      onPress={() => setEstallido((n) => n + 1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {avatar}
      {estallido > 0 ? (
        <View pointerEvents="none" style={styles.estallido}>
          {Array.from({ length: ESTRELLAS }).map((_, i) => (
            <BurstStar key={`${estallido}-${i}`} angulo={(i / ESTRELLAS) * Math.PI * 2} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

/** Una estrella del estallido: sale desde el centro en su ángulo, se agranda y se desvanece. */
function BurstStar({ angulo }: { angulo: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: ESTALLIDO_MS, easing: Easing.out(Easing.quad) });
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: Math.cos(angulo) * ESTRELLA_DIST * p.value },
      { translateY: Math.sin(angulo) * ESTRELLA_DIST * p.value },
      { scale: 0.4 + p.value * 0.9 },
    ],
  }));
  return (
    <Animated.View style={[styles.estrella, style]}>
      <Text style={styles.estrellaText}>⭐</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  estallido: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estrella: {
    position: 'absolute',
  },
  estrellaText: {
    fontSize: 18,
  },
});
