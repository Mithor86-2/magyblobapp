// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import type { Story } from '../../domain/types';

/**
 * A2: el marcado como leído del lector es **explícito**: no se marca al abrir; sí con
 * el botón "Marcar como leído" o cuando la narración termina (`onFinished`). Se
 * sustituyen IO (`api`), narración (audio nativo) e `Icon` (SVG) que jsdom no carga.
 */
const { markReadMock, setFavoriteMock, continueStoryMock, narrationOnFinished, confirmMock } =
  vi.hoisted(() => ({
    markReadMock: vi.fn(),
    setFavoriteMock: vi.fn(),
    continueStoryMock: vi.fn(),
    narrationOnFinished: { current: undefined as undefined | (() => void) },
    confirmMock: vi.fn(),
  }));
vi.mock('../../composition', () => ({
  api: {
    stories: {
      markRead: markReadMock,
      setFavorite: setFavoriteMock,
      continueStory: continueStoryMock,
    },
  },
}));
// Capturamos el `onFinished` que el lector pasa a NarrationControls para simular
// "narración escuchada completa" sin montar el audio real.
vi.mock('../components/NarrationControls', () => ({
  NarrationControls: ({ onFinished }: { onFinished?: () => void }) => {
    narrationOnFinished.current = onFinished;
    return null;
  },
}));
vi.mock('../components/AuthorBadge', () => ({ AuthorBadge: () => null }));
vi.mock('../components/Icon', () => ({ Icon: () => null }));
// La modal de "marcar como leído" al llegar al final (US-27) se prueba capturando confirm.
vi.mock('../components/DialogProvider', () => ({
  useDialog: () => ({ alert: vi.fn(), confirm: confirmMock }),
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

import { StoryReaderScreen } from './StoryReaderScreen';

const STORY: Story = {
  id: 's1',
  profileId: 'p1',
  tema: 'animales',
  estilo: 'aventura',
  titulo: 'El zorro valiente',
  cuerpo: 'Érase una vez...',
  idioma: 'es',
  estado: 'nuevo',
  proveedor: 'mock',
};

const pushMock = vi.fn();
const navigateMock = vi.fn();

function renderReader(story: Story = STORY, anonimo?: boolean) {
  const props = {
    route: { params: { story, anonimo } },
    navigation: { push: pushMock, navigate: navigateMock },
  } as unknown as ComponentProps<typeof StoryReaderScreen>;
  return render(<StoryReaderScreen {...props} />);
}

describe('StoryReaderScreen — marcar leído explícito (A2)', () => {
  beforeEach(() => {
    markReadMock.mockReset();
    markReadMock.mockResolvedValue(undefined);
    narrationOnFinished.current = undefined;
    confirmMock.mockReset();
    navigateMock.mockReset();
  });

  it('NO marca leído solo por abrir la vista', () => {
    renderReader();
    expect(markReadMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Marcar como leído' })).toBeInTheDocument();
  });

  it('el botón "Marcar como leído" marca el cuento y muestra "Leído"', () => {
    renderReader();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como leído' }));
    expect(markReadMock).toHaveBeenCalledWith('s1');
    expect(screen.getByText('Leído')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar como leído' })).not.toBeInTheDocument();
  });

  it('al terminar la narración (onFinished) marca leído', () => {
    renderReader();
    expect(typeof narrationOnFinished.current).toBe('function');
    narrationOnFinished.current!();
    expect(markReadMock).toHaveBeenCalledWith('s1');
  });

  it('si ya estaba leído, muestra "Leído" y no ofrece el botón', () => {
    renderReader({ ...STORY, estado: 'leido' });
    expect(screen.getByText('Leído')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar como leído' })).not.toBeInTheDocument();
  });

  it('#5: el libro empieza por la portada (título + imagen) y termina en "FIN"', () => {
    renderReader();
    // 1ª página del libro: título del cuento + imagen de portada (role img).
    expect(screen.getByText('El zorro valiente')).toBeInTheDocument();
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    // Avanzar hasta el final: la historia (1 página) y luego la página de fin.
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByText(/Fin de la historia/)).toBeInTheDocument();
  });

  it('US-27: la modal sale medio segundo después de llegar a la última página y, al confirmar, marca leído', () => {
    vi.useFakeTimers();
    try {
      renderReader();
      expect(confirmMock).not.toHaveBeenCalled();

      // Avanzar hasta la última página (historia + fin).
      fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
      fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
      // Aún no: la modal espera 500 ms tras mostrarse la página.
      expect(confirmMock).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(confirmMock).toHaveBeenCalledTimes(1);

      // Confirmar la modal marca el cuento como leído.
      const { onConfirm } = confirmMock.mock.calls[0][0] as { onConfirm: () => void };
      act(() => {
        onConfirm();
      });
      expect(markReadMock).toHaveBeenCalledWith('s1');
      expect(screen.getByText('Leído')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('US-27: no ofrece la modal si el cuento ya estaba leído', () => {
    vi.useFakeTimers();
    try {
      renderReader({ ...STORY, estado: 'leido' });
      fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
      fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(confirmMock).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('US-78: "Continuar la historia" genera el capítulo nuevo y abre su lector', async () => {
    continueStoryMock.mockReset();
    pushMock.mockReset();
    const siguiente = { ...STORY, id: 's2', titulo: 'El zorro valiente — la aventura continúa' };
    continueStoryMock.mockResolvedValue(siguiente);
    renderReader();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar la historia' }));
    expect(continueStoryMock).toHaveBeenCalledWith('s1');
    await screen.findByText('El zorro valiente'); // sigue montado hasta que resuelve
    expect(pushMock).toHaveBeenCalledWith('StoryReader', { story: siguiente });
  });

  describe('modo anónimo — puerta de sesión (US-96)', () => {
    it('"Escuchar" abre la modal de crear cuenta y no llama a la narración', () => {
      renderReader(STORY, true);
      // En anónimo no se montan los controles de narración reales.
      expect(narrationOnFinished.current).toBeUndefined();
      fireEvent.click(screen.getByRole('button', { name: 'Escuchar' }));
      expect(confirmMock).toHaveBeenCalledTimes(1);
      expect(confirmMock.mock.calls[0][0].title).toBe('Inicia sesión para continuar');
    });

    it('"Marcar como leído" abre la modal en vez de marcar el cuento', () => {
      renderReader(STORY, true);
      fireEvent.click(screen.getByRole('button', { name: 'Marcar como leído' }));
      expect(markReadMock).not.toHaveBeenCalled();
      expect(confirmMock).toHaveBeenCalledTimes(1);
    });

    it('el botón principal de la modal navega a crear cuenta (Consent)', () => {
      renderReader(STORY, true);
      fireEvent.click(screen.getByRole('button', { name: 'Marcar como leído' }));
      const { onConfirm, confirmLabel } = confirmMock.mock.calls[0][0] as {
        onConfirm: () => void;
        confirmLabel: string;
      };
      expect(confirmLabel).toBe('Crear cuenta');
      onConfirm();
      expect(navigateMock).toHaveBeenCalledWith('Consent');
    });

    it('no auto-ofrece marcar leído al llegar al final', () => {
      vi.useFakeTimers();
      try {
        renderReader(STORY, true);
        fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
        fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
        act(() => {
          vi.advanceTimersByTime(500);
        });
        expect(confirmMock).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
