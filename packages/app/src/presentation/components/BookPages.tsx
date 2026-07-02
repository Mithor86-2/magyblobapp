import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import PageFlipper, { type PageFlipperInstance } from 'react-native-page-flipper';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';

/**
 * Lector **paginado como un libro** con **page-curl real** (US-83, ajustes #1 + #5;
 * sustituye la aproximación reanimated de US-79). El pase de página lo aporta
 * `react-native-page-flipper` (curl real iOS/Android/Web sobre gesture-handler +
 * reanimated + linear-gradient), tanto arrastrando como con los controles ‹ / ›
 * (deshabilitados en los extremos), con el indicador "Página n de total".
 *
 * El libro se compone de: una **portada** opcional (1ª página: título + imagen de
 * portada, US-83 #5), las **páginas de texto** (`paginas`, ya troceadas por
 * `paginarCuento`), y una **página final "FIN"** opcional (`finLabel`). Cada ítem se
 * serializa a `data` (string[], el contrato de la librería) y se pinta en `renderPage`.
 *
 * El índice de página es estado de React sincronizado por `onFlippedEnd`, así los
 * botones ‹/›, el gesto y el indicador comparten la misma verdad; bajo Vitest la
 * librería está aliasada a un stub que refleja el índice (los ‹/› siguen verificables).
 */
type ItemLibro = { tipo: 'portada' } | { tipo: 'texto'; texto: string } | { tipo: 'fin' };

export function BookPages({
  paginas,
  portada,
  finLabel,
}: {
  paginas: string[];
  /** Nodo de portada (título + imagen); si se pasa, es la 1ª página del libro (US-83 #5). */
  portada?: ReactNode;
  /** Etiqueta de la última página ("FIN"); si se pasa, se añade al final (US-83 #5). */
  finLabel?: string;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { width, height } = useWindowDimensions();

  // Ítems del libro: portada (opcional) → páginas de texto → FIN (opcional).
  const items: ItemLibro[] = [
    ...(portada ? [{ tipo: 'portada' } as const] : []),
    ...paginas.map((texto) => ({ tipo: 'texto', texto }) as const),
    ...(finLabel ? [{ tipo: 'fin' } as const] : []),
  ];
  // Sin contenido: una página en blanco (indicador "1/1"), sin intentar rellenar.
  const itemsSeguro: ItemLibro[] = items.length > 0 ? items : [{ tipo: 'texto', texto: '' }];
  const total = itemsSeguro.length;
  // `data` de PageFlipper es string[]: serializamos cada ítem y lo deserializamos al pintar.
  const data = itemsSeguro.map((it) => JSON.stringify(it));

  const flipper = useRef<PageFlipperInstance>(null);
  const [indice, setIndice] = useState(0);

  const enPrimera = indice <= 0;
  const enUltima = indice >= total - 1;

  const renderPage = useCallback(
    (raw: string) => {
      const item = JSON.parse(raw) as ItemLibro;
      if (item.tipo === 'portada') {
        return <View style={[styles.page, styles.pagePortada]}>{portada}</View>;
      }
      if (item.tipo === 'fin') {
        return (
          <View style={[styles.page, styles.pageFin]}>
            <Text style={styles.finText}>{finLabel}</Text>
          </View>
        );
      }
      return (
        <View style={styles.page}>
          <Text style={styles.body} accessibilityRole="text">
            {item.texto}
          </Text>
        </View>
      );
    },
    [portada, finLabel, styles],
  );

  // Tamaño de página: ancho acotado al contenedor, alto proporcional (páginas parejas).
  const pageWidth = Math.round(Math.min(width - spacing.md * 2, 520));
  const pageHeight = Math.max(280, Math.min(460, Math.round(height * 0.46)));

  return (
    <View style={styles.container}>
      <View style={{ height: pageHeight }}>
        <PageFlipper
          ref={flipper}
          data={data}
          renderPage={renderPage}
          pageSize={{ width: pageWidth, height: pageHeight }}
          portrait
          singleImageMode
          contentContainerStyle={styles.flipper}
          onFlippedEnd={(i) => setIndice(i)}
        />
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => flipper.current?.previousPage()}
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
          onPress={() => flipper.current?.nextPage()}
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
    flipper: {
      backgroundColor: 'transparent',
    },
    // Hoja tipo papel: blanco literal (independiente del tema) con relleno holgado.
    page: {
      flex: 1,
      backgroundColor: '#ffffff',
      borderRadius: radius.md,
      padding: spacing.md,
    },
    pagePortada: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    pageFin: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    finText: {
      ...typography.displayLg,
      color: '#1a1a1a',
      letterSpacing: 2,
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
