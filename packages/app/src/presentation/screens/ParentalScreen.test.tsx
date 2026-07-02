// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Zona de adultos (US-85, ajuste #3): al cerrar sesión se vuelve al **Dashboard**
 * (inicio sin sesión con "Prueba un cuento / Prueba unas actividades"), no a
 * `Welcome`. Se sustituyen la puerta parental (passthrough), el diálogo (confirma al
 * instante), el store y Sentry, que no cargan / requieren interacción bajo jsdom.
 */
const { logoutMock, clearProfileMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  clearProfileMock: vi.fn(),
}));

// Estado mínimo del store; `useAppStore(selector)` lo resuelve con el selector real.
const storeState = {
  guardian: { nombre: 'Ana', apellidos: 'Ruiz', email: 'ana@example.com' },
  clearProfile: clearProfileMock,
  logout: logoutMock,
  appLanguage: 'es',
  setAppLanguage: vi.fn(),
  themePreference: 'system',
  setThemePreference: vi.fn(),
};
vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));
// La puerta parental se salta en test (renderiza directamente su contenido).
vi.mock('../components/ParentalGate', () => ({
  ParentalGate: ({ children }: { children: ReactNode }) => children,
}));
// El diálogo de confirmación ejecuta el `onConfirm` de inmediato (sin UI real).
vi.mock('../components/DialogProvider', () => ({
  useDialog: () => ({
    confirm: ({ onConfirm }: { onConfirm: () => void }) => onConfirm(),
    alert: vi.fn(),
  }),
}));
vi.mock('../components/Icon', () => ({ Icon: () => null }));
vi.mock('../../infrastructure/sentry', () => ({ isSentryEnabled: () => false }));
vi.mock('@sentry/react-native', () => ({ captureException: vi.fn() }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

import { ParentalScreen } from './ParentalScreen';

const resetMock = vi.fn();

function renderParental() {
  const props = {
    navigation: { reset: resetMock, navigate: vi.fn() },
  } as unknown as ComponentProps<typeof ParentalScreen>;
  return render(<ParentalScreen {...props} />);
}

describe('ParentalScreen — cerrar sesión (US-85)', () => {
  beforeEach(() => {
    logoutMock.mockReset();
    resetMock.mockReset();
  });

  it('cerrar sesión llama a logout() y resetea la navegación al Dashboard', () => {
    renderParental();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(resetMock).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Dashboard' }] });
  });
});
