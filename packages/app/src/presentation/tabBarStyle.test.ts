import { describe, expect, it } from 'vitest';
import { makeTabBarStyle, TAB_BAR_BASE_HEIGHT } from './tabBarStyle';
import { lightColors } from './theme/tokens';

/**
 * US-88 (#8): la barra de pestañas reserva el inset inferior del sistema (edge-to-edge
 * de Android) para no quedar tapada por la barra de navegación. Se prueba el cálculo puro.
 */
describe('makeTabBarStyle (US-88)', () => {
  it('suma el inset inferior al alto y al paddingBottom', () => {
    const style = makeTabBarStyle({ bottom: 24 }, lightColors);
    expect(style.height).toBe(TAB_BAR_BASE_HEIGHT + 24);
    expect(style.paddingBottom).toBe(24 + 6);
  });

  it('sin inset (bottom = 0) usa el alto base', () => {
    const style = makeTabBarStyle({ bottom: 0 }, lightColors);
    expect(style.height).toBe(TAB_BAR_BASE_HEIGHT);
    expect(style.backgroundColor).toBe(lightColors.surface);
    expect(style.borderTopColor).toBe(lightColors.outline);
  });
});
