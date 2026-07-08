// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AVATARS, AvatarPicker, avatarSource } from './AvatarPicker';

/**
 * Tests user-centric del selector de avatar (US-30/US-103). Cada avatar es un botón con
 * su `id` como nombre accesible; elegirlo notifica ese `id`. (El estado seleccionado se
 * transmite con `accessibilityState`, no proyectado a ARIA por el adaptador web; ver nota
 * en `SelectableChip.test.tsx`.)
 */
describe('AvatarPicker', () => {
  it('muestra todos los avatares como botones localizables por nombre', () => {
    render(<AvatarPicker value={null} onChange={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(AVATARS.length);
    expect(screen.getByRole('button', { name: 'zorro' })).toBeInTheDocument();
  });

  it('al elegir un avatar notifica su id', () => {
    const onChange = vi.fn();
    render(<AvatarPicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'leon' }));

    expect(onChange).toHaveBeenCalledWith('leon');
  });

  it('avatarSource resuelve la imagen por id y cae al avatar por defecto', () => {
    // Un id desconocido (p. ej. un emoji antiguo) cae al avatar por defecto (zorro).
    expect(avatarSource('inexistente')).toBe(avatarSource('zorro'));
    // Ids distintos resuelven a imágenes distintas.
    expect(avatarSource('leon')).not.toBe(avatarSource('zorro'));
  });
});
