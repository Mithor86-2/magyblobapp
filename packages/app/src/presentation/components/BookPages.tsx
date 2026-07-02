import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';

/**
 * Lector **paginado como un libro** (A2/US-73, US-74): muestra una sola página del
 * cuento a la vez y permite pasar página con los controles ‹ / › (deshabilitados en
 * los extremos), con un indicador "Página n de total". El texto de la página se paginó
 * antes con `paginarCuento` (lógica pura); este componente solo presenta y navega.
 *
 * **Flip 3D en dos fases con dirección (US-74/A2).** El "pase de página" se anima con la
 * API `Animated` integrada de React Native (sin dependencias nuevas). Se registra la
 * dirección del giro (avanzar `›` = +1, retroceder `‹` = -1) y el flip encadena dos fases
 * con `perspective` (~1000) sobre `rotateY`:
 *   - Fase 1 (salida): la página actual gira desde `0deg` hasta `±90deg` (el signo lo fija
 *     la dirección) mientras baja la opacidad; al terminar se cambia el `indice` al nuevo.
 *   - Fase 2 (entrada): la página nueva entra desde el lado opuesto (`∓90deg`) hasta
 *     `0deg` subiendo la opacidad, como una hoja que se voltea.
 * Duración total ~320ms (160+160). `useNativeDriver:false` para funcionar igual en nativo
 * y en web (los tests corren sobre react-native-web). Se respetan los límites (no se pasa
 * de 0..total-1) y se evita dividir por cero (`total` mínimo 1).
 *
 * **Hoja en fondo blanco tipo papel (US-74/A2).** La página se pinta sobre una hoja
 * blanca literal (`#ffffff`) con texto oscuro, `borderRadius`, `padding` y sombra/borde
 * suave, de modo que se ve como papel **independiente del tema** (claro u oscuro). Solo la
 * hoja es blanca; el indicador y los botones ‹/› siguen usando tokens de tema para seguir
 * legibles en ambos temas.
 *
 * Accesible: los botones llevan `accessibilityLabel` localizable (reader.prevPage /
 * reader.nextPage) y el cuerpo es texto legible por lector de pantalla.
 */
export function BookPages({ paginas }: { paginas: string[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);

  const total = Math.max(paginas.length, 1);
  const [indice, setIndice] = useState(0);
  // 1 = hoja asentada (visible, sin giro). Durante el flip cae a 0 (fase de salida)
  // y vuelve a 1 (fase de entrada). La dirección decide el signo del ángulo.
  const progress = useRef(new Animated.Value(1)).current;
  const direccion = useRef<1 | -1>(1);

  const enPrimera = indice <= 0;
  const enUltima = indice >= total - 1;

  // Anima el flip 3D en dos fases: la hoja actual gira hacia ±90°, se cambia el índice y
  // la nueva entra desde ∓90° hasta asentarse. La dirección fija el sentido del giro.
  const irA = (siguiente: number) => {
    if (siguiente < 0 || siguiente > total - 1 || siguiente === indice) return;
    direccion.current = siguiente > indice ? 1 : -1;
    // Fase 1 (salida): la página actual se voltea hasta el canto.
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      useNativeDriver: false,
    }).start(() => {
      setIndice(siguiente);
      // Fase 2 (entrada): la nueva página entra desde el lado opuesto hasta asentarse.
      Animated.timing(progress, {
        toValue: 1,
        duration: 160,
        useNativeDriver: false,
      }).start();
    });
  };

  // Ángulo del canto según la dirección: avanzar voltea hacia -90°, retroceder hacia +90°.
  // La página sale hacia un lado (progress→0) y la nueva entra desde el opuesto (progress→1).
  const anguloSalida = direccion.current === 1 ? '-90deg' : '90deg';
  const anguloEntrada = direccion.current === 1 ? '90deg' : '-90deg';
  const rotateY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [anguloSalida, anguloEntrada, '0deg'],
  });
  // La hoja se atenúa en el canto (mitad del recorrido) y recupera opacidad al asentarse.
  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.15, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.page, { opacity, transform: [{ perspective: 1000 }, { rotateY }] }]}
      >
        <Text style={styles.body} accessibilityRole="text">
          {paginas[indice] ?? ''}
        </Text>
      </Animated.View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => irA(indice - 1)}
          disabled={enPrimera}
          accessibilityRole="button"
          accessibilityLabel={t('reader.prevPage')}
          accessibilityState={{ disabled: enPrimera }}
          style={[styles.arrow, enPrimera && styles.arrowDisabled]}
        >
          <Text style={[styles.arrowText, enPrimera && styles.arrowTextDisabled]}>‹</Text>
        </Pressable>

        <Text style={styles.indicator}>{t('reader.page', { n: indice + 1, total })}</Text>

        <Pressable
          onPress={() => irA(indice + 1)}
          disabled={enUltima}
          accessibilityRole="button"
          accessibilityLabel={t('reader.nextPage')}
          accessibilityState={{ disabled: enUltima }}
          style={[styles.arrow, enUltima && styles.arrowDisabled]}
        >
          <Text style={[styles.arrowText, enUltima && styles.arrowTextDisabled]}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    // Hoja tipo papel: blanco literal (independiente del tema) con sombra/borde suave.
    page: {
      minHeight: 120,
      backgroundColor: '#ffffff',
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    body: {
      ...typography.bodyLg,
      // Texto oscuro fijo para contrastar sobre la hoja blanca en cualquier tema.
      color: '#1a1a1a',
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    arrow: {
      backgroundColor: colors.secondaryContainer,
      borderRadius: radius.pill,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowDisabled: {
      opacity: 0.4,
    },
    arrowText: {
      ...typography.headlineMd,
      color: colors.onSurface,
      lineHeight: 28,
    },
    arrowTextDisabled: {
      color: colors.onSurfaceVariant,
    },
    indicator: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
  });
