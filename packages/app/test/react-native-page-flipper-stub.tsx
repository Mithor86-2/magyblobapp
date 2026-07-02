/**
 * Stub de `react-native-page-flipper` para los tests (Vitest + jsdom).
 *
 * La librería del page-curl es nativa (gesture-handler + reanimated + linear-gradient)
 * y no resuelve bajo el runner; la aliasamos a este stub en `vitest.config.ts` (mismo
 * patrón que reanimated/gesture-handler). El stub mantiene su **propio índice** de
 * página, pinta `renderPage(data[index])` (una página a la vez, como en portrait) y
 * expone por ref `goToPage/previousPage/nextPage`, que actualizan el índice y llaman a
 * `onFlippedEnd(index)` — así los controles ‹/› de `BookPages` siguen siendo
 * verificables sin el hilo nativo. El curl real se comprueba a mano/E2E en dispositivo.
 */
import { forwardRef, useImperativeHandle, useState, type ReactNode } from 'react';

export type PageFlipperInstance = {
  goToPage: (index: number) => void;
  previousPage: () => void;
  nextPage: () => void;
};

interface PageFlipperStubProps {
  data: string[];
  renderPage?: (data: string) => ReactNode;
  onFlippedEnd?: (index: number) => void;
}

const PageFlipper = forwardRef<PageFlipperInstance, PageFlipperStubProps>(function PageFlipper(
  { data, renderPage, onFlippedEnd },
  ref,
) {
  const [index, setIndex] = useState(0);

  const ir = (destino: number) => {
    const siguiente = Math.max(0, Math.min(data.length - 1, destino));
    setIndex(siguiente);
    onFlippedEnd?.(siguiente);
  };

  useImperativeHandle(
    ref,
    () => ({
      goToPage: ir,
      previousPage: () => ir(index - 1),
      nextPage: () => ir(index + 1),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, data.length],
  );

  return <>{renderPage ? renderPage(data[index] ?? '') : null}</>;
});

export default PageFlipper;
