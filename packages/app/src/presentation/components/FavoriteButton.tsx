import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useTheme } from '../theme/ThemeProvider';

interface FavoriteButtonProps {
  /** Estado actual de favorito del ítem (ausente ⇒ no favorito). */
  favorito?: boolean;
  /**
   * Alterna el favorito al nuevo valor. La actualización es **optimista**: el botón
   * pinta el nuevo estado al instante y, si la promesa falla, revierte sin romper la
   * pantalla. Quien lo pase puede refrescar su propio estado al resolverse.
   */
  onToggle: (favorito: boolean) => Promise<unknown>;
}

/**
 * Botón estrella para marcar/desmarcar un favorito (US-64). Estrella rellena cuando
 * es favorito; tap target generoso. Mantiene un estado optimista local: refleja el
 * cambio de inmediato y vuelve atrás si el `onToggle` rechaza.
 */
export function FavoriteButton({ favorito, onToggle }: FavoriteButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [optimista, setOptimista] = useState(favorito ?? false);

  const activo = optimista;
  const press = () => {
    const nuevo = !activo;
    setOptimista(nuevo); // optimista: pinta ya
    void onToggle(nuevo).catch(() => setOptimista(activo)); // revierte si falla
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={activo ? t('favorite.remove') : t('favorite.add')}
      onPress={press}
      style={styles.tap}
    >
      <Icon
        name="favorite"
        size="md"
        fill={activo}
        color={activo ? colors.primary : colors.outline}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tap: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
