import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';

/**
 * Avatar del niño como **imagen** empaquetada (US-103; antes era un emoji, US-90/US-94).
 *
 * **Nota (crash):** US-90 introdujo un **balanceo idle en bucle** + un **estallido de estrellas**
 * al tocar, con reanimated; se **desactivó** porque provoca un crash nativo de **reanimated 4 /
 * New Architecture** (`stof: out of range` en `performNonLayoutOperations`) al procesar eventos
 * táctiles/scroll con una animación reanimated activa en la pantalla visible (ver
 * `Docs/lecciones-aprendidas.md`). Se renderiza **estático**. Se conserva la firma (incluida
 * `interactive`) para no tocar las pantallas que lo usan; ya no anima ni es pulsable.
 */
export function AnimatedAvatar({
  source,
  size,
  style,
  accessibilityLabel,
}: {
  source: ImageSourcePropType;
  /** Lado del avatar en px (imagen cuadrada). */
  size: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  /** Conservado por compatibilidad (US-90); sin efecto tras desactivar la animación. */
  interactive?: boolean;
}) {
  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
