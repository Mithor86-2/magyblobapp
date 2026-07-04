import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryEventBus } from '../../src/infrastructure/events/InMemoryEventBus.js';
import {
  wireDomainEvents,
  type DomainEventSinks,
} from '../../src/infrastructure/events/subscribers.js';
import {
  InMemoryAuditLogRepository,
  InMemoryInteractionEventRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

describe('wireDomainEvents', () => {
  let bus: InMemoryEventBus;
  let events: InMemoryInteractionEventRepository;
  let audit: InMemoryAuditLogRepository;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    events = new InMemoryInteractionEventRepository();
    audit = new InMemoryAuditLogRepository();
    const sinks: DomainEventSinks = {
      events,
      audit,
      newId: secuencialIdGenerator(),
      now: relojFijo(),
    };
    wireDomainEvents(bus, sinks);
  });

  it('traduce los eventos de uso a InteractionEvent (telemetría) sin tocar auditoría', async () => {
    await bus.publish({
      tipo: 'cuento_generado',
      profileId: 'p-1',
      storyId: 's-1',
      tema: 'animales',
      estilo: 'aventura',
    });

    expect(audit.items).toHaveLength(0);
    expect(events.items).toHaveLength(1);
    const evento = events.items[0];
    expect(evento.tipo).toBe('cuento_generado');
    expect(evento.profileId).toBe('p-1');
    expect(evento.payload).toEqual({ storyId: 's-1', tema: 'animales', estilo: 'aventura' });
  });

  it('registra la narración con su voiceId', async () => {
    await bus.publish({
      tipo: 'cuento_narrado',
      profileId: 'p-1',
      storyId: 's-1',
      voiceId: 'voz-es',
    });

    expect(events.items).toHaveLength(1);
    expect(events.items[0].payload).toEqual({ storyId: 's-1', voiceId: 'voz-es' });
  });

  it('registra la actividad completada con su valoración', async () => {
    await bus.publish({
      tipo: 'actividad_completada',
      profileId: 'p-1',
      activityId: 'a-1',
      valoracion: 3,
    });

    expect(events.items).toHaveLength(1);
    expect(events.items[0].payload).toEqual({ activityId: 'a-1', valoracion: 3 });
  });

  it('traduce las acciones sensibles a AuditLog sin tocar telemetría', async () => {
    await bus.publish({ tipo: 'perfil_creado', guardianId: 'g-1', profileId: 'p-1' });

    expect(events.items).toHaveLength(0);
    expect(audit.items).toHaveLength(1);
    const entrada = audit.items[0];
    expect(entrada.accion).toBe('crear');
    expect(entrada.entidad).toBe('ChildProfile');
    expect(entrada.entidadId).toBe('p-1');
    expect(entrada.guardianId).toBe('g-1');
  });

  it('audita el consentimiento del registro con la versión en metadatos', async () => {
    await bus.publish({
      tipo: 'guardian_registrado',
      guardianId: 'g-1',
      consentimientoVersion: 'v1',
    });

    expect(audit.items).toHaveLength(1);
    expect(audit.items[0].accion).toBe('consentimiento');
    expect(audit.items[0].entidad).toBe('Guardian');
    expect(audit.items[0].metadatos).toEqual({ version: 'v1' });
  });

  it('audita el login del adulto', async () => {
    await bus.publish({ tipo: 'guardian_login', guardianId: 'g-1' });

    expect(audit.items).toHaveLength(1);
    expect(audit.items[0].accion).toBe('login');
    expect(audit.items[0].entidad).toBe('Guardian');
  });

  it('audita la verificación de email del adulto (US-93)', async () => {
    await bus.publish({ tipo: 'email_verificado', guardianId: 'g-1' });

    expect(audit.items).toHaveLength(1);
    expect(audit.items[0].accion).toBe('verificar_email');
    expect(audit.items[0].entidad).toBe('Guardian');
    expect(audit.items[0].guardianId).toBe('g-1');
  });
});
