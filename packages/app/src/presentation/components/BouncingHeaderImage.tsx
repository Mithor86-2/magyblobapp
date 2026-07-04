import { Image, type ImageSourcePropType, type StyleProp, type ImageStyle } from 'react-native';

/**
 * Imagen de cabecera de pantalla (US-58/US-86).
 *
 * **Nota (crash):** US-86 introdujo un **rebote en bucle** con reanimated; se **desactivó**
 * porque provoca un crash nativo de **reanimated 4 / New Architecture** (`stof: out of range`
 * en `performNonLayoutOperations`) al procesar eventos táctiles/scroll mientras hay una
 * animación en bucle activa (ver `Docs/lecciones-aprendidas.md`). Se renderiza **estática**;
 * el rebote podrá reintroducirse cuando el combo Expo/RN/reanimated lo permita sin crashear.
 * Mantiene `resizeMode="contain"` y el rol de accesibilidad `image` de la cabecera original.
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
  return (
    <Image
      source={source}
      style={style}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
