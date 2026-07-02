/**
 * Estilo de la barra de pestañas inferior (US-88, ajustes #7 + #8). Lógica de
 * presentación **pura** (sin JSX ni módulos nativos) para poder probar el cálculo del
 * inset sin montar el navegador.
 *
 * **#8 (visibilidad en Android):** con el edge-to-edge por defecto de Expo SDK 54+ la
 * barra queda bajo la barra de navegación del sistema y las pestañas activas no se ven.
 * Se reserva `paddingBottom = insets.bottom` y se suma ese inset al alto, de modo que el
 * contenido de la barra queda **por encima** de la nav bar del sistema.
 *
 * **#7 (el activo ocupa todo el botón):** el fondo del ítem activo lo pinta el navegador
 * (`tabBarActiveBackgroundColor`) sobre toda la celda; aquí se define el alto/relleno para
 * que ese fondo (con el `tabBarItemStyle` redondeado) cubra icono y etiqueta.
 */
import type { ColorTokens } from './theme/tokens';

/** Alto base de la barra (sin contar el inset inferior del sistema). */
export const TAB_BAR_BASE_HEIGHT = 64;

interface EdgeInsets {
  bottom: number;
}

/** Estilo de `tabBarStyle` con el inset inferior reservado (US-88). */
export function makeTabBarStyle(insets: EdgeInsets, colors: ColorTokens) {
  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.outline,
    height: TAB_BAR_BASE_HEIGHT + insets.bottom,
    paddingBottom: insets.bottom + 6,
    paddingTop: 6,
  } as const;
}
