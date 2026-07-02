import { describe, expect, it } from 'vitest';
import { Story } from '../../src/domain/entities/Story.js';
import { Activity } from '../../src/domain/entities/Activity.js';
import {
  computeStatsLogros,
  evaluarLogros,
  LOGROS,
  progresoLogro,
  rachaMaximaDias,
} from '../../src/domain/logros.js';
import type { Tema } from '../../src/domain/vocabulary.js';

/**
 * US-68: catálogo de logros y su lógica pura de evaluación (tier CORE). Sin IO: se
 * calcula sobre `Story`/`Activity` ya persistidos.
 */

function cuento(tema: Tema, estado: 'nuevo' | 'leido', dia: string): Story {
  return new Story({
    id: `s-${tema}-${dia}`,
    profileId: 'p-1',
    tema,
    estilo: 'aventura',
    titulo: 'T',
    cuerpo: 'C',
    idioma: 'es',
    proveedor: 'mock',
    estado,
    creadoEn: new Date(`${dia}T10:00:00.000Z`),
  });
}

function actividad(completadaEn: Date | undefined): Activity {
  return new Activity({
    id: `a-${completadaEn?.toISOString() ?? 'pend'}`,
    profileId: 'p-1',
    categoria: 'arte',
    titulo: 'T',
    descripcion: 'D',
    proveedor: 'mock',
    completadaEn,
    valoracion: completadaEn ? 3 : undefined,
  });
}

describe('rachaMaximaDias', () => {
  it('sin fechas es 0', () => {
    expect(rachaMaximaDias([])).toBe(0);
  });

  it('un solo día es racha 1 (aunque se repita el mismo día)', () => {
    expect(
      rachaMaximaDias([new Date('2026-07-01T08:00:00Z'), new Date('2026-07-01T20:00:00Z')]),
    ).toBe(1);
  });

  it('cuenta días consecutivos y no depende del orden de entrada', () => {
    const fechas = [
      new Date('2026-07-03T10:00:00Z'),
      new Date('2026-07-01T10:00:00Z'),
      new Date('2026-07-02T10:00:00Z'),
    ];
    expect(rachaMaximaDias(fechas)).toBe(3);
  });

  it('un hueco reinicia la racha y devuelve la máxima', () => {
    const fechas = [
      new Date('2026-07-01T10:00:00Z'),
      new Date('2026-07-02T10:00:00Z'),
      // hueco el día 3
      new Date('2026-07-04T10:00:00Z'),
      new Date('2026-07-05T10:00:00Z'),
      new Date('2026-07-06T10:00:00Z'),
    ];
    expect(rachaMaximaDias(fechas)).toBe(3);
  });
});

describe('computeStatsLogros', () => {
  it('cuenta cuentos leídos, actividades completadas y temas explorados', () => {
    const stories = [
      cuento('animales', 'leido', '2026-07-01'),
      cuento('espacio', 'leido', '2026-07-02'),
      cuento('magia', 'nuevo', '2026-07-02'),
    ];
    const activities = [actividad(new Date('2026-07-03T10:00:00Z')), actividad(undefined)];
    const stats = computeStatsLogros(stories, activities);
    expect(stats.cuentosLeidos).toBe(2);
    expect(stats.actividadesCompletadas).toBe(1);
    expect([...stats.temasLeidos].sort()).toEqual(['animales', 'espacio']);
    // Días de uso: 01, 02 (leídos) + 03 (actividad) = racha de 3.
    expect(stats.rachaDias).toBe(3);
  });
});

describe('evaluarLogros / progresoLogro', () => {
  const logro = (clave: string) => LOGROS.find((l) => l.clave === clave)!;

  it('desbloquea el hito de 1 cuento leído pero no el de 5', () => {
    const stats = computeStatsLogros([cuento('animales', 'leido', '2026-07-01')], []);
    const claves = evaluarLogros(stats);
    expect(claves).toContain('cuentos_leidos_1');
    expect(claves).not.toContain('cuentos_leidos_5');
  });

  it('desbloquea el logro de tema al leer un cuento de ese tema', () => {
    const stats = computeStatsLogros([cuento('espacio', 'leido', '2026-07-01')], []);
    expect(evaluarLogros(stats)).toContain('tema_espacio');
    expect(evaluarLogros(stats)).not.toContain('tema_magia');
  });

  it('desbloquea la racha de 3 pero no la de 7', () => {
    const stories = [
      cuento('animales', 'leido', '2026-07-01'),
      cuento('espacio', 'leido', '2026-07-02'),
      cuento('magia', 'leido', '2026-07-03'),
    ];
    const claves = evaluarLogros(computeStatsLogros(stories, []));
    expect(claves).toContain('racha_dias_3');
    expect(claves).not.toContain('racha_dias_7');
  });

  it('el progreso se limita a la meta del logro', () => {
    const stories = Array.from({ length: 30 }, (_u, i) =>
      cuento('animales', 'leido', `2026-07-${String((i % 28) + 1).padStart(2, '0')}`),
    );
    const stats = computeStatsLogros(stories, []);
    expect(progresoLogro(logro('cuentos_leidos_25'), stats)).toBe(25);
  });
});
