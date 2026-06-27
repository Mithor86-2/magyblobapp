// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Pressable, Text } from 'react-native';

/**
 * Tests user-centric de `ConsentScreen` (alta, US-48). Comprobamos que el alta exige
 * una contraseña de longitud mínima (botón deshabilitado por debajo) y que, al enviar,
 * la contraseña viaja al backend junto al resto de datos.
 *
 * Dobles: `ParentalGate` y `Screen` (solo chrome de layout) → passthrough; `BubblyButton`
 * se sustituye porque importa el wrapper de iconos lucide (no carga bajo Vitest, ver
 * vitest.config.ts); `composition` (gateway), el store y `useDialog` se mockean.
 * `TextField`/`SelectableChip` se usan reales por ser la interacción.
 */
const { registerMock, setSessionMock, alertMock, replaceMock } = vi.hoisted(() => ({
  registerMock: vi.fn(),
  setSessionMock: vi.fn(),
  alertMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock('../components/ParentalGate', () => ({
  ParentalGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../components/Screen', () => ({
  Screen: ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => (
    <>
      {children}
      {footer}
    </>
  ),
}));
vi.mock('../components/BubblyButton', () => ({
  BubblyButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}>
      <Text>{label}</Text>
    </Pressable>
  ),
}));
vi.mock('../../composition', () => ({ api: { guardians: { register: registerMock } } }));
vi.mock('../components/DialogProvider', () => ({ useDialog: () => ({ alert: alertMock }) }));
vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ setSession: setSessionMock }),
}));

import { ConsentScreen } from './ConsentScreen';

function renderConsent() {
  const navigation = { replace: replaceMock } as never;
  return render(
    <ConsentScreen navigation={navigation} route={{ key: 'Consent', name: 'Consent' } as never} />,
  );
}

/** Rellena los campos obligatorios; la contraseña la decide quien llama. */
function rellenarFormulario(password: string) {
  fireEvent.change(screen.getByTestId('alta-nombre'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByTestId('alta-apellidos'), { target: { value: 'García' } });
  fireEvent.change(screen.getByTestId('alta-email'), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByTestId('alta-password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Madre' }));
  fireEvent.click(screen.getByRole('button', { name: 'Acepto' }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConsentScreen (US-48)', () => {
  it('no permite el alta con una contraseña por debajo del mínimo', () => {
    renderConsent();
    rellenarFormulario('corta');
    expect(screen.getByRole('button', { name: 'Aceptar y continuar' })).toBeDisabled();
  });

  it('no permite el alta con ≥8 caracteres pero sin número (US-53)', () => {
    renderConsent();
    rellenarFormulario('sololetras');
    expect(screen.getByRole('button', { name: 'Aceptar y continuar' })).toBeDisabled();
  });

  it('no permite el alta con ≥8 caracteres pero sin letra (US-53)', () => {
    renderConsent();
    rellenarFormulario('12345678');
    expect(screen.getByRole('button', { name: 'Aceptar y continuar' })).toBeDisabled();
  });

  it('muestra la ayuda visual del requisito de la contraseña (US-53)', () => {
    renderConsent();
    expect(screen.getByTestId('alta-password-ayuda')).toBeTruthy();
  });

  it('envía la contraseña al backend cuando cumple el mínimo', async () => {
    registerMock.mockResolvedValue({ id: 'g1', accessToken: 'a', refreshToken: 'r' });
    renderConsent();
    rellenarFormulario('Contrasena123');

    const boton = screen.getByRole('button', { name: 'Aceptar y continuar' });
    expect(boton).not.toBeDisabled();
    fireEvent.click(boton);

    await waitFor(() => expect(registerMock).toHaveBeenCalledTimes(1));
    expect(registerMock.mock.calls[0][0]).toMatchObject({
      email: 'ana@example.com',
      password: 'Contrasena123',
      parentesco: 'madre',
      consentimientoAceptado: true,
    });
  });
});
