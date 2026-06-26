import { describe, expect, it } from 'vitest';
import { Guardian, type GuardianProps } from '../../src/domain/entities/Guardian.js';
import { Story, type StoryProps } from '../../src/domain/entities/Story.js';
import { Activity, type ActivityProps } from '../../src/domain/entities/Activity.js';
import { InteractionEvent } from '../../src/domain/entities/InteractionEvent.js';
import { StoryNarration } from '../../src/domain/entities/StoryNarration.js';
import { AuditLog } from '../../src/domain/entities/AuditLog.js';
import { DomainError } from '../../src/domain/errors.js';
import { HASH_DE_PRUEBA } from '../support/doubles.js';

/**
 * Invariantes de las entidades de dominio. Tier CORE (Strategic Coverage 100/80/0,
 * US-35): si una entidad acepta datos inválidos, el negocio o el cumplimiento se
 * rompen (p. ej. un Guardian sin consentimiento válido, una valoración fuera de 1-3).
 * Los casos de uso solo ejercitan el camino feliz; aquí cubrimos cada guarda.
 */

const fecha = new Date('2026-06-10T12:00:00.000Z');

describe('Guardian', () => {
  function build(overrides: Partial<GuardianProps> = {}): Guardian {
    return new Guardian({
      id: 'g-1',
      nombre: 'Ana',
      apellidos: 'García',
      email: 'Ana@Example.com ',
      parentesco: 'madre',
      passwordHash: HASH_DE_PRUEBA,
      consentimiento: { dado: true, fecha, version: 'v1' },
      creadoEn: fecha,
      ...overrides,
    });
  }

  it('normaliza el email (recorte + minúsculas)', () => {
    expect(build().email).toBe('ana@example.com');
  });

  it('exige un hash de contraseña no vacío (US-48)', () => {
    expect(() => build({ passwordHash: '  ' })).toThrow(DomainError);
  });

  it('exige nombre no vacío', () => {
    expect(() => build({ nombre: '  ' })).toThrow(DomainError);
  });

  it('exige apellidos no vacíos', () => {
    expect(() => build({ apellidos: '' })).toThrow(DomainError);
  });

  it('rechaza un email mal formado', () => {
    expect(() => build({ email: 'sin-arroba' })).toThrow(DomainError);
  });

  it('rechaza un parentesco fuera del vocabulario', () => {
    // @ts-expect-error valor inválido a propósito
    expect(() => build({ parentesco: 'vecino' })).toThrow(DomainError);
  });

  it('haConsentido refleja el consentimiento', () => {
    expect(build().haConsentido()).toBe(true);
    expect(build({ consentimiento: { dado: false, fecha, version: 'v1' } }).haConsentido()).toBe(
      false,
    );
  });
});

describe('Story', () => {
  function build(overrides: Partial<StoryProps> = {}): Story {
    return new Story({
      id: 's-1',
      profileId: 'p-1',
      tema: 'animales',
      estilo: 'aventura',
      titulo: 'El zorro',
      cuerpo: 'Érase una vez.',
      idioma: 'es',
      proveedor: 'mock',
      creadoEn: fecha,
      ...overrides,
    });
  }

  it('se crea en estado "nuevo" por defecto', () => {
    expect(build().estado).toBe('nuevo');
  });

  it('respeta un estado explícito', () => {
    expect(build({ estado: 'leido' }).estado).toBe('leido');
  });

  it('marcarLeido cambia el estado y es idempotente', () => {
    const s = build();
    s.marcarLeido();
    expect(s.estado).toBe('leido');
    s.marcarLeido();
    expect(s.estado).toBe('leido');
  });

  it('rechaza tema inválido', () => {
    // @ts-expect-error valor inválido a propósito
    expect(() => build({ tema: 'piratas' })).toThrow(DomainError);
  });

  it('rechaza estilo inválido', () => {
    // @ts-expect-error valor inválido a propósito
    expect(() => build({ estilo: 'terror' })).toThrow(DomainError);
  });

  it('rechaza título vacío', () => {
    expect(() => build({ titulo: '   ' })).toThrow(DomainError);
  });

  it('rechaza cuerpo vacío', () => {
    expect(() => build({ cuerpo: '' })).toThrow(DomainError);
  });

  it('rechaza proveedor de IA inválido', () => {
    // @ts-expect-error valor inválido a propósito
    expect(() => build({ proveedor: 'gpt' })).toThrow(DomainError);
  });
});

describe('Activity', () => {
  function build(overrides: Partial<ActivityProps> = {}): Activity {
    return new Activity({
      id: 'a-1',
      profileId: 'p-1',
      categoria: 'arte',
      titulo: 'Pintar',
      descripcion: 'Pinta con los dedos.',
      proveedor: 'mock',
      ...overrides,
    });
  }

  it('rechaza categoría inválida', () => {
    // @ts-expect-error valor inválido a propósito
    expect(() => build({ categoria: 'cocina' })).toThrow(DomainError);
  });

  it('rechaza título vacío', () => {
    expect(() => build({ titulo: '  ' })).toThrow(DomainError);
  });

  it('rechaza descripción vacía', () => {
    expect(() => build({ descripcion: '' })).toThrow(DomainError);
  });

  it('rechaza proveedor de IA inválido', () => {
    // @ts-expect-error valor inválido a propósito
    expect(() => build({ proveedor: 'gpt' })).toThrow(DomainError);
  });

  it('completar registra valoración (1-3) y la fecha', () => {
    const a = build();
    a.completar(3, fecha);
    expect(a.valoracion).toBe(3);
    expect(a.completadaEn).toBe(fecha);
  });

  it.each([0, 4, -1, 2.5])('completar rechaza valoración %s', (valoracion) => {
    expect(() => build().completar(valoracion, fecha)).toThrow(DomainError);
  });
});

describe('InteractionEvent', () => {
  it('se crea con un tipo válido', () => {
    const e = new InteractionEvent({
      id: 'e-1',
      profileId: 'p-1',
      tipo: 'cuento_generado',
      creadoEn: fecha,
    });
    expect(e.tipo).toBe('cuento_generado');
  });

  it('rechaza un tipo de evento inválido', () => {
    expect(
      // @ts-expect-error valor inválido a propósito
      () => new InteractionEvent({ id: 'e-1', profileId: 'p-1', tipo: 'login', creadoEn: fecha }),
    ).toThrow(DomainError);
  });

  it('exige un profileId no vacío', () => {
    expect(
      () =>
        new InteractionEvent({
          id: 'e-1',
          profileId: '  ',
          tipo: 'pantalla_vista',
          creadoEn: fecha,
        }),
    ).toThrow(DomainError);
  });
});

describe('StoryNarration', () => {
  const base = { id: 'n-1', storyId: 's-1', idioma: 'es' as const, creadoEn: fecha };

  it('se crea con mp3 y voz válidos', () => {
    const n = new StoryNarration({ ...base, mp3: new Uint8Array([1, 2, 3]), voiceId: 'sofia' });
    expect(n.voiceId).toBe('sofia');
  });

  it('rechaza una narración vacía (mp3 de 0 bytes)', () => {
    expect(() => new StoryNarration({ ...base, mp3: new Uint8Array(), voiceId: 'sofia' })).toThrow(
      DomainError,
    );
  });

  it('exige una voz', () => {
    expect(() => new StoryNarration({ ...base, mp3: new Uint8Array([1]), voiceId: '  ' })).toThrow(
      DomainError,
    );
  });
});

describe('AuditLog', () => {
  const base = { id: 'al-1', entidad: 'Guardian', entidadId: 'g-1', creadoEn: fecha };

  it('registra una acción sensible válida', () => {
    const log = new AuditLog({ ...base, accion: 'consentimiento', guardianId: 'g-1' });
    expect(log.accion).toBe('consentimiento');
  });

  it('rechaza una acción fuera del vocabulario', () => {
    // @ts-expect-error valor inválido a propósito
    expect(() => new AuditLog({ ...base, accion: 'exportar' })).toThrow(DomainError);
  });

  it('exige una entidad afectada', () => {
    expect(() => new AuditLog({ ...base, entidad: '  ', accion: 'crear' })).toThrow(DomainError);
  });
});
