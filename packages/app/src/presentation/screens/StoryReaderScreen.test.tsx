// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import type { Story } from '../../domain/types';

/**
 * A2: el marcado como leído del lector es **explícito**: no se marca al abrir; sí con
 * el botón "Marcar como leído" o cuando la narración termina (`onFinished`). Se
 * sustituyen IO (`api`), narración (audio nativo) e `Icon` (SVG) que jsdom no carga.
 */
const { markReadMock, setFavoriteMock, narrationOnFinished } = vi.hoisted(() => ({
  markReadMock: vi.fn(),
  setFavoriteMock: vi.fn(),
  narrationOnFinished: { current: undefined as undefined | (() => void) },
}));
vi.mock('../../composition', () => ({
  api: { stories: { markRead: markReadMock, setFavorite: setFavoriteMock } },
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

function renderReader(story: Story = STORY) {
  const props = { route: { params: { story } } } as unknown as ComponentProps<
    typeof StoryReaderScreen
  >;
  return render(<StoryReaderScreen {...props} />);
}

describe('StoryReaderScreen — marcar leído explícito (A2)', () => {
  beforeEach(() => {
    markReadMock.mockReset();
    markReadMock.mockResolvedValue(undefined);
    narrationOnFinished.current = undefined;
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
});
