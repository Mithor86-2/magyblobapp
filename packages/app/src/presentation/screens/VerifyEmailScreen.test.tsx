// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Pressable, Text } from 'react-native';
import { ApiError } from '../../domain/errors';

/**
 * Tests user-centric de `VerifyEmailScreen` (US-93). Reproducimos lo que hace una
 * persona adulta: escribe el código de 6 dígitos recibido por email y pulsa
 * "Verificar". Comprobamos que la pantalla llama al backend con `guardianId`+código,
 * abre sesión al validar, muestra un aviso ante error y gestiona el reenvío con cooldown.
 *
 * Dobles: `composition` (gateway), store, `useDialog`, telemetría y `BubblyButton`
 * (arrastra el wrapper de iconos lucide, que no carga bajo Vitest). `TextField` real.
 */
const { verifyMock, resendMock, setSessionMock, alertMock, replaceMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(),
  resendMock: vi.fn(),
  setSessionMock: vi.fn(),
  alertMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock('./ConsentScreen', () => ({ CONSENT_VERSION: '1.0' }));
vi.mock('../components/Screen', () => ({
  Screen: ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => (
    <>
      {children}
      {footer}
    </>
  ),
}));
vi.mock('../../composition', () => ({
  api: { guardians: { verifyEmail: verifyMock, resendVerification: resendMock } },
}));
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

import { VerifyEmailScreen } from './VerifyEmailScreen';

function renderVerify() {
  const navigation = { replace: replaceMock } as never;
  const route = {
    key: 'VerifyEmail',
    name: 'VerifyEmail',
    params: { guardianId: 'g1', email: 'ana@example.com' },
  } as never;
  return render(<VerifyEmailScreen navigation={navigation} route={route} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VerifyEmailScreen (US-93)', () => {
  it('valida el código de 6 dígitos y abre sesión', async () => {
    verifyMock.mockResolvedValue({ id: 'g1', accessToken: 'a', refreshToken: 'r' });
    renderVerify();

    fireEvent.change(screen.getByTestId('verify-codigo'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    await waitFor(() => expect(verifyMock).toHaveBeenCalledWith('g1', '123456'));
    await waitFor(() => expect(setSessionMock).toHaveBeenCalled());
    expect(replaceMock).toHaveBeenCalledWith('SelectProfile');
  });

  it('deshabilita el botón hasta tener 6 dígitos', () => {
    renderVerify();
    fireEvent.change(screen.getByTestId('verify-codigo'), { target: { value: '123' } });
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled();
  });

  it('ante intentos agotados (429) muestra el aviso correspondiente y no abre sesión', async () => {
    verifyMock.mockRejectedValue(new ApiError(429, 'TooManyRequestsError', 'demasiados'));
    renderVerify();

    fireEvent.change(screen.getByTestId('verify-codigo'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    await waitFor(() => expect(alertMock).toHaveBeenCalled());
    const mensaje = alertMock.mock.calls[0][0].message as string;
    expect(mensaje).toMatch(/demasiados intentos/i);
    expect(setSessionMock).not.toHaveBeenCalled();
  });

  it('permite reenviar el código una vez pasado el cooldown', async () => {
    vi.useFakeTimers();
    try {
      resendMock.mockResolvedValue(undefined);
      renderVerify();
      // Cooldown inicial de 60 s: el reenvío arranca deshabilitado.
      expect(screen.getByTestId('verify-resend')).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByTestId('verify-resend')).not.toBeDisabled();

      fireEvent.click(screen.getByTestId('verify-resend'));
      expect(resendMock).toHaveBeenCalledWith('g1');
    } finally {
      vi.useRealTimers();
    }
  });
});
