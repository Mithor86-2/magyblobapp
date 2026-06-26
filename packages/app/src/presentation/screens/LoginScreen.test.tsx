// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Pressable, Text } from 'react-native';
import { ApiError } from '../../domain/errors';

/**
 * Tests user-centric de `LoginScreen` (US-48). Reproducimos lo que hace una persona
 * adulta: escribe email + contraseña y pulsa "Entrar". Comprobamos que la pantalla
 * envía AMBOS valores al backend y que ante un 401 muestra un aviso **genérico** (sin
 * distinguir email inexistente de contraseña errónea).
 *
 * Dobles: `composition` (el gateway HTTP), el store de sesión, `useDialog` (el aviso
 * modal es otra responsabilidad) y la telemetría. `BubblyButton` se sustituye porque
 * importa el wrapper de iconos lucide (no carga bajo Vitest, ver vitest.config.ts);
 * `TextField` se usa real por ser la interacción.
 */
const { loginMock, setSessionMock, alertMock, replaceMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  setSessionMock: vi.fn(),
  alertMock: vi.fn(),
  replaceMock: vi.fn(),
}));

// `LoginScreen` importa `CONSENT_VERSION` de `ConsentScreen`, que arrastra `BubblyButton`
// → `Icon` (lucide, no carga bajo Vitest). Mockeamos solo la constante que se usa.
vi.mock('./ConsentScreen', () => ({ CONSENT_VERSION: '1.0' }));
// `Screen` importa `react-native-safe-area-context` (no carga bajo Vitest); passthrough.
vi.mock('../components/Screen', () => ({
  Screen: ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => (
    <>
      {children}
      {footer}
    </>
  ),
}));
vi.mock('../../composition', () => ({ api: { guardians: { login: loginMock } } }));
vi.mock('../components/DialogProvider', () => ({ useDialog: () => ({ alert: alertMock }) }));
vi.mock('../../infrastructure/telemetry', () => ({ trackAction: vi.fn() }));
vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ setSession: setSessionMock }),
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

import { LoginScreen } from './LoginScreen';

function renderLogin() {
  const navigation = { replace: replaceMock } as never;
  return render(
    <LoginScreen navigation={navigation} route={{ key: 'Login', name: 'Login' } as never} />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginScreen (US-48)', () => {
  it('envía email + contraseña al backend y abre la sesión', async () => {
    loginMock.mockResolvedValue({ id: 'g1', accessToken: 'a', refreshToken: 'r' });
    renderLogin();

    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'Contrasena123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'Contrasena123',
      }),
    );
    await waitFor(() => expect(setSessionMock).toHaveBeenCalled());
  });

  it('ante un 401 muestra un aviso genérico que no distingue qué credencial falló', async () => {
    loginMock.mockRejectedValue(new ApiError(401, 'InvalidCredentialsError', 'da igual'));
    renderLogin();

    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'mala' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(alertMock).toHaveBeenCalled());
    const mensaje = alertMock.mock.calls[0][0].message as string;
    expect(mensaje).toMatch(/email o la contraseña/i);
    expect(setSessionMock).not.toHaveBeenCalled();
  });

  it('no permite enviar sin contraseña (botón deshabilitado)', () => {
    renderLogin();
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'ana@example.com' } });
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
  });
});
