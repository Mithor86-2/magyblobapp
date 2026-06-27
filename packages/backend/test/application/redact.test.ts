import { describe, expect, it } from 'vitest';
import { redactarNombre } from '../../src/application/redact.js';

describe('redactarNombre (C-5, US-59)', () => {
  it('quita el nombre del niño del título (case-insensitive)', () => {
    expect(redactarNombre('Mateo y la aventura de espacio', 'Mateo')).toBe(
      'y la aventura de espacio',
    );
    expect(redactarNombre('La gran aventura de LOLA', 'Lola')).toBe('La gran aventura de');
  });

  it('solo redacta palabras completas (no subcadenas)', () => {
    // "Ana" no debe romper "manana"/"Banana".
    expect(redactarNombre('La banana de Ana', 'Ana')).toBe('La banana de');
  });

  it('normaliza los espacios sobrantes tras redactar', () => {
    expect(redactarNombre('Un día Leo fue Leo al parque', 'Leo')).toBe('Un día fue al parque');
  });

  it('devuelve el texto sin cambios si el nombre está vacío', () => {
    expect(redactarNombre('Título cualquiera', '   ')).toBe('Título cualquiera');
  });

  it('devuelve cadena vacía si el título era solo el nombre', () => {
    expect(redactarNombre('Mateo', 'Mateo')).toBe('');
  });
});
