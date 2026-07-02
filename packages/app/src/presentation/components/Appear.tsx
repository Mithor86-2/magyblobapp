import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Envoltura de **animación de entrada** (A5): al montar, sus hijos aparecen con un
 * leve desplazamiento hacia arriba y un pequeño "pop" de escala, para dar vida a
 * imágenes, tarjetas y botones. Usa la API `Animated` integrada de React Native (sin
 * módulos nativos ni dependencias nuevas); `useNativeDriver: false` para funcionar
 * igual en nativo y web (los tests corren sobre react-native-web). No altera el layout
 * ni la **visibilidad**: anima `translateY` (12→0) y `scale` (0.98→1), no la opacidad
 * (una opacidad 0 inicial haría que los tests trataran el contenido como no visible).
 */
export function Appear({
  children,
  style,
  delay = 0,
  duration = 320,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, delay, duration]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });

  return (
    <Animated.View style={[style, { transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
