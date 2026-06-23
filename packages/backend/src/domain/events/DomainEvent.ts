import type { Estilo, Tema } from '../vocabulary.js';

/**
 * Eventos de dominio: hechos relevantes que **ya han ocurrido**. El publicador los
 * emite sin saber quién los consume; los suscriptores (telemetría, auditoría…)
 * deciden cómo registrarlos. Ver `infrastructure/events/subscribers.ts`.
 *
 * Cada variante lleva exactamente los datos que su registro necesita, de modo que
 * los suscriptores no tratan con `payload` débilmente tipado. Regla de menores: lo
 * que viaje a telemetría no contiene PII (ver Docs/cumplimiento-menores.md).
 */

export interface CuentoGenerado {
  tipo: 'cuento_generado';
  profileId: string;
  storyId: string;
  tema: Tema;
  estilo: Estilo;
}

export interface CuentoNarrado {
  tipo: 'cuento_narrado';
  profileId: string;
  storyId: string;
  voiceId: string;
}

export interface ActividadCompletada {
  tipo: 'actividad_completada';
  profileId: string;
  activityId: string;
  valoracion?: number;
}

export interface PerfilCreado {
  tipo: 'perfil_creado';
  guardianId: string;
  profileId: string;
}

export interface GuardianRegistrado {
  tipo: 'guardian_registrado';
  guardianId: string;
  consentimientoVersion: string;
}

export interface GuardianLogin {
  tipo: 'guardian_login';
  guardianId: string;
}

/** Unión discriminada por `tipo` de todos los eventos de dominio. */
export type DomainEvent =
  | CuentoGenerado
  | CuentoNarrado
  | ActividadCompletada
  | PerfilCreado
  | GuardianRegistrado
  | GuardianLogin;
