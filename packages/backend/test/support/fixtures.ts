import { randomUUID } from 'node:crypto';

import { Activity } from '../../src/domain/entities/Activity.js';
import { AuditLog } from '../../src/domain/entities/AuditLog.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { Guardian } from '../../src/domain/entities/Guardian.js';
import { InteractionEvent } from '../../src/domain/entities/InteractionEvent.js';
import { Story } from '../../src/domain/entities/Story.js';
import { StoryNarration } from '../../src/domain/entities/StoryNarration.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import type { PrismaClient } from '../../src/generated/prisma/index.js';
import { PrismaChildProfileRepository } from '../../src/infrastructure/repositories/PrismaChildProfileRepository.js';
import { PrismaGuardianRepository } from '../../src/infrastructure/repositories/PrismaGuardianRepository.js';

/**
 * Factorías de entidades de dominio válidas para los tests de integración.
 * Centralizadas para no duplicar la construcción en cada fichero (id aleatorio
 * por defecto; fecha fija para asertos deterministas).
 */
const FECHA = new Date('2026-06-10T12:00:00.000Z');

export function nuevoGuardian(overrides: Partial<{ id: string; email: string }> = {}): Guardian {
  return new Guardian({
    id: overrides.id ?? randomUUID(),
    nombre: 'Ana',
    apellidos: 'García',
    email: overrides.email ?? `ana-${randomUUID()}@example.com`,
    parentesco: 'madre',
    telefono: '600123123',
    consentimiento: { dado: true, fecha: FECHA, version: 'v1' },
    creadoEn: FECHA,
  });
}

export function nuevoPerfil(
  guardianId: string,
  overrides: Partial<{ id: string }> = {},
): ChildProfile {
  return new ChildProfile({
    id: overrides.id ?? randomUUID(),
    guardianId,
    nombre: 'Mateo',
    edad: Edad.create(4),
    idioma: Idioma.create('es'),
    avatar: 'a1',
    intereses: ['animales', 'espacio'],
    creadoEn: FECHA,
  });
}

export function nuevoCuento(profileId: string, overrides: Partial<{ id: string }> = {}): Story {
  return new Story({
    id: overrides.id ?? randomUUID(),
    profileId,
    tema: 'animales',
    estilo: 'aventura',
    titulo: 'El zorro valiente',
    cuerpo: 'Había una vez un zorro que cruzó el bosque.',
    idioma: 'es',
    proveedor: 'mock',
    creadoEn: FECHA,
  });
}

export function nuevaActividad(
  profileId: string,
  overrides: Partial<{ id: string }> = {},
): Activity {
  return new Activity({
    id: overrides.id ?? randomUUID(),
    profileId,
    categoria: 'arte',
    titulo: 'Pintar un bosque',
    descripcion: 'Dibuja tu animal favorito del cuento.',
    duracionMin: 15,
    nivel: 1,
    proveedor: 'mock',
  });
}

export function nuevaNarracion(
  storyId: string,
  overrides: Partial<{ id: string }> = {},
): StoryNarration {
  return new StoryNarration({
    id: overrides.id ?? randomUUID(),
    storyId,
    mp3: new TextEncoder().encode('mp3-bytes-de-prueba'),
    voiceId: 'voz-test',
    idioma: 'es',
    creadoEn: FECHA,
  });
}

export function nuevoEvento(
  profileId: string,
  overrides: Partial<{ id: string; payload: Record<string, unknown> | undefined }> = {},
): InteractionEvent {
  return new InteractionEvent({
    id: overrides.id ?? randomUUID(),
    profileId,
    tipo: 'cuento_generado',
    payload: 'payload' in overrides ? overrides.payload : { tema: 'animales' },
    creadoEn: FECHA,
  });
}

export function nuevaAuditoria(
  overrides: Partial<{ id: string; guardianId: string | undefined }> = {},
): AuditLog {
  return new AuditLog({
    id: overrides.id ?? randomUUID(),
    guardianId: 'guardianId' in overrides ? overrides.guardianId : undefined,
    accion: 'login',
    entidad: 'Guardian',
    entidadId: randomUUID(),
    metadatos: { resultado: 'ok' },
    creadoEn: FECHA,
  });
}

/**
 * Siembra un adulto y un perfil de niño asociados (satisface las FK que necesitan
 * cuentos, actividades, eventos y narraciones) y devuelve sus ids.
 */
export async function seedGuardianYPerfil(
  prisma: PrismaClient,
): Promise<{ guardianId: string; profileId: string }> {
  const guardian = nuevoGuardian();
  await new PrismaGuardianRepository(prisma).save(guardian);
  const perfil = nuevoPerfil(guardian.id);
  await new PrismaChildProfileRepository(prisma).save(perfil);
  return { guardianId: guardian.id, profileId: perfil.id };
}
