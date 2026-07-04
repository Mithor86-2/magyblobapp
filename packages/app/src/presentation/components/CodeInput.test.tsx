// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CodeInput } from './CodeInput';

/**
 * US-93: la entrada del OTP son casillas por dígito sobre un input real. Verificamos
 * que muestra cada dígito del valor y que, al escribir, solo admite dígitos y acota a
 * la longitud (el input subyacente conserva el `testID` para tests/E2E).
 */
describe('CodeInput (US-93)', () => {
  it('muestra un dígito por casilla según el valor', () => {
    render(<CodeInput value="135" onChangeText={vi.fn()} testID="otp" />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('al escribir solo admite dígitos y los acota a la longitud', () => {
    const onChangeText = vi.fn();
    render(<CodeInput value="" onChangeText={onChangeText} testID="otp" />);
    fireEvent.change(screen.getByTestId('otp'), { target: { value: 'a1b2c3d4e5f6g7' } });
    expect(onChangeText).toHaveBeenCalledWith('123456');
  });

  it('respeta una longitud personalizada', () => {
    const onChangeText = vi.fn();
    render(<CodeInput value="" onChangeText={onChangeText} length={4} testID="otp" />);
    fireEvent.change(screen.getByTestId('otp'), { target: { value: '12345' } });
    expect(onChangeText).toHaveBeenCalledWith('1234');
  });
});
