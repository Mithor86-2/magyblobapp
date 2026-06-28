import { describe, expect, it } from 'vitest';
import type { Activity, Story } from '../../domain/types';
import { filtrarActividades, filtrarCuentos, TODOS } from './historyFilters';

/**
 * US-62: lógica de filtrado en cliente del Historial. Al elegir un tema/estilo/
 * categoría la lista se reduce; "Todos" (TODOS) muestra todo.
 */
const story = (id: string, tema: Story['tema'], estilo: Story['estilo']): Story => ({
  id,
  profileId: 'p1',
  tema,
  estilo,
  titulo: `Cuento ${id}`,
  cuerpo: '...',
  idioma: 'es',
  estado: 'nuevo',
  proveedor: 'mock',
});

const activity = (id: string, categoria: Activity['categoria']): Activity => ({
  id,
  profileId: 'p1',
  categoria,
  titulo: `Actividad ${id}`,
  descripcion: '...',
  proveedor: 'mock',
});

const cuentos = [
  story('1', 'animales', 'aventura'),
  story('2', 'espacio', 'educativo'),
  story('3', 'animales', 'divertido'),
];

const actividades = [activity('a', 'arte'), activity('b', 'musica'), activity('c', 'arte')];

describe('filtrarCuentos', () => {
  it('con TODOS/TODOS muestra todos los cuentos', () => {
    expect(filtrarCuentos(cuentos, TODOS, TODOS)).toHaveLength(3);
  });

  it('reduce por tema', () => {
    const out = filtrarCuentos(cuentos, 'animales', TODOS);
    expect(out.map((s) => s.id)).toEqual(['1', '3']);
  });

  it('reduce por estilo', () => {
    const out = filtrarCuentos(cuentos, TODOS, 'educativo');
    expect(out.map((s) => s.id)).toEqual(['2']);
  });

  it('combina tema y estilo', () => {
    const out = filtrarCuentos(cuentos, 'animales', 'aventura');
    expect(out.map((s) => s.id)).toEqual(['1']);
  });
});

describe('filtrarActividades', () => {
  it('con TODOS muestra todas las actividades', () => {
    expect(filtrarActividades(actividades, TODOS)).toHaveLength(3);
  });

  it('reduce por categoría', () => {
    const out = filtrarActividades(actividades, 'arte');
    expect(out.map((a) => a.id)).toEqual(['a', 'c']);
  });
});
