// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Pressable, Text } from 'react-native';
import { DialogProvider, useDialog } from './DialogProvider';

/**
 * Tests user-centric de los avisos/confirmaciones de la app (US-23/US-30). Un
 * componente consumidor dispara `alert`/`confirm` y verificamos lo que percibe la
 * persona usuaria: aparece el mensaje, los botones tienen su nombre y al pulsarlos
 * se ejecuta (o no) la acción y se cierra el diálogo. El icono se sustituye por un
 * doble (lo arrastra `BubblyButton`).
 */
vi.mock('./Icon', () => ({ Icon: () => null }));

/** Botón de prueba que dispara una acción del diálogo. */
function Disparador({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <Text>{label}</Text>
    </Pressable>
  );
}

function conProvider(consumer: ReactNode) {
  return render(<DialogProvider>{consumer}</DialogProvider>);
}

describe('DialogProvider', () => {
  it('alert: muestra título y mensaje y se cierra al confirmar', () => {
    function Consumer() {
      const dialog = useDialog();
      return (
        <Disparador
          label="avisar"
          onPress={() => dialog.alert({ title: 'Atención', message: 'Algo ha ocurrido' })}
        />
      );
    }
    conProvider(<Consumer />);

    fireEvent.click(screen.getByRole('button', { name: 'avisar' }));
    expect(screen.getByText('Atención')).toBeVisible();
    expect(screen.getByText('Algo ha ocurrido')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByText('Algo ha ocurrido')).not.toBeInTheDocument();
  });

  it('confirm: al aceptar ejecuta onConfirm y cierra', () => {
    const onConfirm = vi.fn();
    function Consumer() {
      const dialog = useDialog();
      return (
        <Disparador
          label="borrar"
          onPress={() =>
            dialog.confirm({
              title: 'Borrar perfil',
              message: '¿Seguro que quieres borrarlo?',
              destructive: true,
              onConfirm,
            })
          }
        />
      );
    }
    conProvider(<Consumer />);

    fireEvent.click(screen.getByRole('button', { name: 'borrar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('¿Seguro que quieres borrarlo?')).not.toBeInTheDocument();
  });

  it('confirm: al cancelar no ejecuta onConfirm y cierra', () => {
    const onConfirm = vi.fn();
    function Consumer() {
      const dialog = useDialog();
      return (
        <Disparador
          label="borrar"
          onPress={() =>
            dialog.confirm({
              title: 'Borrar perfil',
              message: '¿Seguro que quieres borrarlo?',
              onConfirm,
            })
          }
        />
      );
    }
    conProvider(<Consumer />);

    fireEvent.click(screen.getByRole('button', { name: 'borrar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText('¿Seguro que quieres borrarlo?')).not.toBeInTheDocument();
  });

  it('useDialog fuera de DialogProvider lanza un error claro', () => {
    function Solo() {
      useDialog();
      return null;
    }
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Solo />)).toThrow(/DialogProvider/);
    errSpy.mockRestore();
  });
});
