import { AuditLog } from '../../domain/entities/AuditLog.js';
import { InteractionEvent } from '../../domain/entities/InteractionEvent.js';
import type { DomainEvent } from '../../domain/events/DomainEvent.js';
import type { DomainEventHandler, EventBus } from '../../domain/events/EventBus.js';
import type { AuditLogRepository } from '../../domain/repositories/AuditLogRepository.js';
import type { InteractionEventRepository } from '../../domain/repositories/InteractionEventRepository.js';
import type { Clock, IdGenerator } from '../../application/ports.js';

/**
 * Lo que necesitan los suscriptores para registrar un evento. `AppDeps` lo satisface
 * estructuralmente, así que en producción se pasa `deps` tal cual; en tests, un objeto
 * mínimo con dobles en memoria.
 */
export interface DomainEventSinks {
  events: InteractionEventRepository;
  audit: AuditLogRepository;
  newId: IdGenerator;
  now: Clock;
}

/** Persiste los eventos de uso de primera parte (InteractionEvent). Ignora el resto. */
function telemetrySubscriber(sinks: DomainEventSinks): DomainEventHandler {
  return async (event: DomainEvent): Promise<void> => {
    switch (event.tipo) {
      case 'cuento_generado':
        await sinks.events.save(
          new InteractionEvent({
            id: sinks.newId(),
            profileId: event.profileId,
            tipo: 'cuento_generado',
            payload: { storyId: event.storyId, tema: event.tema, estilo: event.estilo },
            creadoEn: sinks.now(),
          }),
        );
        return;
      case 'cuento_narrado':
        await sinks.events.save(
          new InteractionEvent({
            id: sinks.newId(),
            profileId: event.profileId,
            tipo: 'cuento_narrado',
            payload: { storyId: event.storyId, voiceId: event.voiceId },
            creadoEn: sinks.now(),
          }),
        );
        return;
      case 'actividad_completada':
        await sinks.events.save(
          new InteractionEvent({
            id: sinks.newId(),
            profileId: event.profileId,
            tipo: 'actividad_completada',
            payload: { activityId: event.activityId, valoracion: event.valoracion },
            creadoEn: sinks.now(),
          }),
        );
        return;
      default:
        // Eventos de auditoría: los registra `auditSubscriber`.
        return;
    }
  };
}

/** Registra las acciones sensibles del adulto (AuditLog). Ignora la telemetría. */
function auditSubscriber(sinks: DomainEventSinks): DomainEventHandler {
  return async (event: DomainEvent): Promise<void> => {
    switch (event.tipo) {
      case 'perfil_creado':
        await sinks.audit.save(
          new AuditLog({
            id: sinks.newId(),
            guardianId: event.guardianId,
            accion: 'crear',
            entidad: 'ChildProfile',
            entidadId: event.profileId,
            creadoEn: sinks.now(),
          }),
        );
        return;
      case 'guardian_registrado':
        await sinks.audit.save(
          new AuditLog({
            id: sinks.newId(),
            guardianId: event.guardianId,
            accion: 'consentimiento',
            entidad: 'Guardian',
            entidadId: event.guardianId,
            metadatos: { version: event.consentimientoVersion },
            creadoEn: sinks.now(),
          }),
        );
        return;
      case 'guardian_login':
        await sinks.audit.save(
          new AuditLog({
            id: sinks.newId(),
            guardianId: event.guardianId,
            accion: 'login',
            entidad: 'Guardian',
            entidadId: event.guardianId,
            creadoEn: sinks.now(),
          }),
        );
        return;
      case 'email_verificado':
        await sinks.audit.save(
          new AuditLog({
            id: sinks.newId(),
            guardianId: event.guardianId,
            accion: 'verificar_email',
            entidad: 'Guardian',
            entidadId: event.guardianId,
            creadoEn: sinks.now(),
          }),
        );
        return;
      default:
        // Eventos de uso: los registra `telemetrySubscriber`.
        return;
    }
  };
}

/**
 * Registra en el bus los suscriptores de telemetría y auditoría. Se llama una vez en
 * el composition root (y en el helper de tests). Añadir métricas/cumplimiento futuro
 * es añadir aquí otro `bus.subscribe(...)`, sin tocar las rutas.
 */
export function wireDomainEvents(bus: EventBus, sinks: DomainEventSinks): void {
  bus.subscribe(telemetrySubscriber(sinks));
  bus.subscribe(auditSubscriber(sinks));
}
