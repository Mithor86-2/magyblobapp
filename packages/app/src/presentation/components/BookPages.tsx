import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';

/**
 * Lector **paginado como un libro** (A2/US-73): muestra una sola página del cuento a
 * la vez y permite pasar página con los controles ‹ / › (deshabilitados en los
 * extremos), con un indicador "Página n de total". El texto de la página se paginó
 * antes con `paginarCuento` (lógica pura); este componente solo presenta y navega.
 *
 * El "pase de página" se anima con la API `Animated` integrada de React Native (sin
 * dependencias nuevas), con un leve giro (rotateY) y desplazamiento; `useNativeDriver:
 * false` para funcionar igual en nativo y web (los tests corren sobre react-native-web).
 * Accesible: los botones llevan `accessibilityLabel` localizable (reader.prevPage /
 * reader.nextPage) y el cuerpo es texto legible por lector de pantalla.
 */
export function BookPages({ paginas }: { paginas: string[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);

  const total = Math.max(paginas.length, 1);
  const [indice, setIndice] = useState(0);
  const progress = useRef(new Animated.Value(1)).current;

  const enPrimera = indice <= 0;
  const enUltima = indice >= total - 1;

  // Anima el pase de página: desvanece/gira la actual, cambia el índice y vuelve.
  const irA = (siguiente: number) => {
    if (siguiente < 0 || siguiente > total - 1 || siguiente === indice) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      setIndice(siguiente);
      Animated.timing(progress, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    });
  };

  const rotateY = progress.interpolate({ inputRange: [0, 1], outputRange: ['12deg', '0deg'] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const opacity = progress;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.page,
          { opacity, transform: [{ perspective: 800 }, { rotateY }, { translateX }] },
        ]}
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
    page: {
      minHeight: 120,
    },
    body: {
      ...typography.bodyLg,
      color: colors.onSurface,
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
