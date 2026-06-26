// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { ParentalGate } from './ParentalGate';

/**
 * Tests user-centric de la puerta parental (US-30). Reproducimos lo que hace una
 * persona adulta: ve el reto, elige una opción y, según acierte o falle, accede o
 * no al contenido protegido. El reto es aleatorio, así que el test lee la operación
 * mostrada para saber cuál es la respuesta correcta (como haría la persona usuaria).
 *
 * Dobles: `Screen` (solo es chrome de layout) y `useDialog` (el aviso modal es otra
 * responsabilidad) se sustituyen; `SelectableChip` se usa real por ser parte de la
 * interacción.
 */
const { alertMock } = vi.hoisted(() => ({ alertMock: vi.fn() }));
vi.mock('./Screen', () => ({ Screen: ({ children }: { children: ReactNode }) => children }));
vi.mock('./DialogProvider', () => ({ useDialog: () => ({ alert: alertMock }) }));

/** Lee la operación mostrada ("a + b = ?") y devuelve la suma correcta. */
function leerRespuestaCorrecta(): number {
  const match = document.body.textContent?.match(/(\d+)\s*\+\s*(\d+)\s*=/);
  if (!match) throw new Error('No se encontró la operación del reto');
  return Number(match[1]) + Number(match[2]);
}

beforeEach(() => {
  alertMock.mockClear();
});

describe('ParentalGate', () => {
  it('muestra el reto y oculta el contenido protegido hasta resolverlo', () => {
    render(
      <ParentalGate>
        <Protegido />
      </ParentalGate>,
    );

    expect(screen.getByText('Zona de personas adultas')).toBeVisible();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('con la respuesta correcta, revela el contenido protegido', () => {
    render(
      <ParentalGate>
        <Protegido />
      </ParentalGate>,
    );

    const correcta = leerRespuestaCorrecta();
    fireEvent.click(screen.getByRole('button', { name: String(correcta) }));

    expect(screen.getByText('Contenido protegido')).toBeVisible();
  });

  it('con una respuesta incorrecta, avisa y no revela el contenido', () => {
    render(
      <ParentalGate>
        <Protegido />
      </ParentalGate>,
    );

    const correcta = leerRespuestaCorrecta();
    // Un distractor siempre presente: correcta - 1.
    fireEvent.click(screen.getByRole('button', { name: String(correcta - 1) }));

    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });
});

function Protegido() {
  return <Text>Contenido protegido</Text>;
}
