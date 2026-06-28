import { describe, expect, it } from 'vitest';
import type { Activity, Story } from '../../domain/types';
import { filtrarActividades, filtrarCuentos, normalizar, TODOS } from './historyFilters';

/**
 * US-62: lógica de filtrado en cliente del Historial. Al elegir un tema/estilo/
 * categoría la lista se reduce; "Todos" (TODOS) muestra todo.
 * US-64: además, filtro "solo favoritos" y búsqueda de texto normalizada (sin
 * mayúsculas ni acentos), combinables con los anteriores.
 */
const story = (
  id: string,
  tema: Story['tema'],
  estilo: Story['estilo'],
  extra: Partial<Story> = {},
): Story => ({
  id,
  profileId: 'p1',
  tema,
  estilo,
  titulo: `Cuento ${id}`,
  cuerpo: '...',
  idioma: 'es',
  estado: 'nuevo',
  proveedor: 'mock',
  ...extra,
});

const activity = (
  id: string,
  categoria: Activity['categoria'],
  extra: Partial<Activity> = {},
): Activity => ({
  id,
  profileId: 'p1',
  categoria,
  titulo: `Actividad ${id}`,
  descripcion: '...',
  proveedor: 'mock',
  ...extra,
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

describe('normalizar (US-64)', () => {
  it('pasa a minúsculas y quita las marcas diacríticas (incluida la ñ → n)', () => {
    // NFD descompone ñ en n + tilde combinante, así la búsqueda es insensible a la ñ.
    expect(normalizar('Música ÁGUILA Ñoño')).toBe('musica aguila nono');
  });
});

describe('filtro "solo favoritos" (US-64)', () => {
  const favs = [
    story('1', 'animales', 'aventura', { favorito: true }),
    story('2', 'espacio', 'educativo'),
    story('3', 'magia', 'divertido', { favorito: false }),
  ];

  it('cuentos: solo favoritos deja los marcados', () => {
    const out = filtrarCuentos(favs, TODOS, TODOS, true);
    expect(out.map((s) => s.id)).toEqual(['1']);
  });

  it('cuentos: desactivado muestra todos', () => {
    expect(filtrarCuentos(favs, TODOS, TODOS, false)).toHaveLength(3);
  });

  it('actividades: solo favoritas deja las marcadas', () => {
    const acts = [
      activity('a', 'arte', { favorito: true }),
      activity('b', 'musica'),
      activity('c', 'logica', { favorito: true }),
    ];
    expect(filtrarActividades(acts, TODOS, true).map((a) => a.id)).toEqual(['a', 'c']);
  });
});

describe('búsqueda de texto normalizada (US-64)', () => {
  const buscables = [
    story('1', 'animales', 'aventura', { titulo: 'El Águila valiente', cuerpo: 'Volaba alto.' }),
    story('2', 'espacio', 'educativo', { titulo: 'Cohete', cuerpo: 'Viaje a la Luna.' }),
  ];

  it('vacío = todo', () => {
    expect(filtrarCuentos(buscables, TODOS, TODOS, false, '')).toHaveLength(2);
    expect(filtrarCuentos(buscables, TODOS, TODOS, false, '   ')).toHaveLength(2);
  });

  it('coincide ignorando mayúsculas y acentos en el título', () => {
    const out = filtrarCuentos(buscables, TODOS, TODOS, false, 'aguila');
    expect(out.map((s) => s.id)).toEqual(['1']);
  });

  it('coincide por subcadena en el cuerpo', () => {
    const out = filtrarCuentos(buscables, TODOS, TODOS, false, 'luna');
    expect(out.map((s) => s.id)).toEqual(['2']);
  });

  it('coincide por tema/estilo (id del vocabulario)', () => {
    expect(filtrarCuentos(buscables, TODOS, TODOS, false, 'espacio').map((s) => s.id)).toEqual([
      '2',
    ]);
  });

  it('actividades: busca en descripción, instrucciones y categoría', () => {
    const acts = [
      activity('a', 'arte', { descripcion: 'Pinta con acuarelas' }),
      activity('b', 'musica', { instrucciones: 'Toca el tambor' }),
    ];
    expect(filtrarActividades(acts, TODOS, false, 'acuarela').map((a) => a.id)).toEqual(['a']);
    expect(filtrarActividades(acts, TODOS, false, 'tambor').map((a) => a.id)).toEqual(['b']);
    expect(filtrarActividades(acts, TODOS, false, 'musica').map((a) => a.id)).toEqual(['b']);
  });

  it('sin coincidencias devuelve vacío', () => {
    expect(filtrarCuentos(buscables, TODOS, TODOS, false, 'dinosaurio')).toHaveLength(0);
  });
});

describe('combinación de filtros (US-62 + US-64)', () => {
  const mix = [
    story('1', 'animales', 'aventura', { titulo: 'Gato favorito', favorito: true }),
    story('2', 'animales', 'aventura', { titulo: 'Perro', favorito: false }),
    story('3', 'animales', 'aventura', { titulo: 'Gato común', favorito: true }),
  ];

  it('tema + solo favoritos + búsqueda se aplican a la vez', () => {
    const out = filtrarCuentos(mix, 'animales', 'aventura', true, 'gato');
    expect(out.map((s) => s.id)).toEqual(['1', '3']);
  });
});
