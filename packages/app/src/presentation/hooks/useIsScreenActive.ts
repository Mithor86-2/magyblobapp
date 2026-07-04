import { useContext, useEffect, useState } from 'react';
import { NavigationContext } from '@react-navigation/native';

/**
 * `true` si la pantalla que contiene al componente está **enfocada**. Fuera de un
 * navegador (p. ej. tests que renderizan el componente aislado) devuelve `true`.
 *
 * Se usa para **pausar animaciones en bucle** cuando la pantalla se desenfoca: en un
 * tab navigator, `react-native-screens` **desacopla/congela la vista nativa** de la
 * pestaña inactiva mientras el componente sigue montado; una animación reanimated en
 * vuelo sobre esa vista desacoplada **crashea en nativo** (reanimated 4 / New Arch) al
 * cambiar de pestaña rápido. Como la pantalla no se desmonta, `cancelAnimation` en el
 * cleanup de desmontaje no basta: hay que parar la animación en el `blur`.
 */
export function useIsScreenActive(): boolean {
  const navigation = useContext(NavigationContext);
  const [activo, setActivo] = useState(() => (navigation ? navigation.isFocused() : true));

  useEffect(() => {
    if (!navigation) return;
    const alEnfocar = () => setActivo(true);
    const alDesenfocar = () => setActivo(false);
    const unsubFocus = navigation.addListener('focus', alEnfocar);
    const unsubBlur = navigation.addListener('blur', alDesenfocar);
    setActivo(navigation.isFocused());
    return () => {
      unsubFocus();
      unsubBlur();
    };
  }, [navigation]);

  return activo;
}
