import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Amplitud del rebote vertical (px): normal (con giro) y **más suave** (tramo sin giro). */
const REBOTE_PX = 5;
const REBOTE_SUAVE_PX = 3;
/** Amplitud del balanceo/giro a cada lado (grados). */
const GIRO_DEG = 7;
/** Duración del bucle idle (ms): 3–4 s, continuo y sin cortes. */
const LOOP_MS = 4000;
/** Salto de escala al tocar (feedback táctil). */
const POP_ESCALA = 1.2;

/** Nº de estrellas del estallido al tocar, su distancia de salida (px) y duración (ms). */
const ESTRELLAS = 8;
const ESTRELLA_DIST = 46;
const ESTALLIDO_MS = 700;

const TAU = Math.PI * 2;

/**
 * Avatar del niño (emoji de animal) con **animación idle continua** (US-90, ajuste #2):
 * un balanceo orgánico que combina un rebote vertical suave (2 rebotes por bucle) con un
 * giro alterno izquierda↔derecha (1 vaivén por bucle), sin pausas estáticas. Se define con
 * una única fase de progreso 0→1 en bucle e interpolación por **seno** (los extremos del
 * ciclo coinciden, así el loop es perfecto sin cortes); el seno da un `ease-in-out` natural,
 * blando y tierno. Bucle de ~3,5 s.
 *
 * Al **tocarlo** (`interactive`): salto rápido de **escala** (feedback táctil) + **ráfaga de
 * estrellas** que salen del centro hacia afuera y se desvanecen.
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
  /** Si es `true`, el avatar es pulsable y al tocarlo hace pop + estallido de estrellas. */
  interactive?: boolean;
}) {
  // Progreso del bucle idle (0→1 en LOOP_MS, en bucle sin reverse: los extremos coinciden).
  const progreso = useSharedValue(0);
  // Escala del avatar (1 en reposo; salta a POP_ESCALA al tocar y vuelve).
  const escala = useSharedValue(1);
  // Cada toque remonta el estallido (key incremental) para reiniciar su animación.
  const [estallido, setEstallido] = useState(0);

  useEffect(() => {
    progreso.value = withRepeat(withTiming(1, { duration: LOOP_MS, easing: Easing.linear }), -1);
    // Cancela las animaciones en vuelo al desmontar (navegar fuera): sin esto, en
    // reanimated 4 / New Arch el bucle tocaría un nodo destruido y crashea en nativo.
    return () => {
      cancelAnimation(progreso);
      cancelAnimation(escala);
    };
  }, [progreso, escala]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progreso.value;
    const a = p * TAU;
    // Ventana del giro: seno² → **cero en los extremos del bucle** (tramo de rebote-solo,
    // continuo a través del corte) y máximo hacia el centro. Mantiene el loop sin cortes.
    const ventanaGiro = Math.sin(p * Math.PI) ** 2;
    // Rebote más suave cuando no hay giro; amplitud plena cuando el vaivén está activo.
    const amplitud = REBOTE_SUAVE_PX + (REBOTE_PX - REBOTE_SUAVE_PX) * ventanaGiro;
    return {
      transform: [
        // 2 rebotes por bucle; el seno da el ease-in-out y cierra el loop sin salto.
        { translateY: -amplitud * Math.sin(a * 2) },
        // 1 vaivén izquierda↔derecha por bucle, atenuado por la ventana (rebote-solo en los extremos).
        { rotate: `${GIRO_DEG * Math.sin(a) * ventanaGiro}deg` },
        { scale: escala.value },
      ],
    };
  });

  function onTap() {
    // Feedback táctil: salto rápido de escala y vuelta suave.
    escala.value = withSequence(
      withTiming(POP_ESCALA, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.ease) }),
    );
    setEstallido((n) => n + 1);
  }

  const avatar = (
    <Animated.View style={animatedStyle}>
      <Text style={style} accessibilityLabel={accessibilityLabel}>
        {emoji}
      </Text>
    </Animated.View>
  );

  if (!interactive) return avatar;

  return (
    <Pressable onPress={onTap} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {avatar}
      {estallido > 0 ? (
        <View pointerEvents="none" style={styles.estallido}>
          {Array.from({ length: ESTRELLAS }).map((_, i) => (
            <BurstStar key={`${estallido}-${i}`} angulo={(i / ESTRELLAS) * TAU} />
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
    // Cancela la animación en vuelo al desmontar: la estrella se desmonta sola al acabar
    // el estallido (y al navegar fuera de Inicio); sin esto, en reanimated 4 / New Arch
    // la animación tocaría un nodo destruido y crashea en nativo (misma causa que el loop).
    return () => cancelAnimation(p);
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
