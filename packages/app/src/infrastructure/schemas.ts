/**
 * Esquemas Zod de las respuestas del backend. Viven en `infrastructure` (no en
 * `domain`, que no admite dependencias externas): validan en la frontera HTTP lo
 * que entra por la red antes de propagarlo a la app, cerrando el agujero del cast
 * `as TResponse`. Reutilizan los vocabularios cerrados del dominio (`TEMAS`,
 * `CATEGORIAS`, …) como única fuente de verdad de los valores válidos.
 */
import { z } from 'zod';
import {
  CATEGORIAS,
  CATEGORIAS_LOGRO,
  ENSENANZAS,
  ESTILOS,
  IDIOMAS,
  PARENTESCOS,
  PROVEEDORES_IA,
  TEMAS,
} from '../domain/types';

export const guardianSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellidos: z.string(),
  email: z.string(),
  parentesco: z.enum(PARENTESCOS),
  consentimientoDado: z.boolean(),
  // US-93: titularidad del email verificada; opcional (backend antiguo la omite).
  emailVerificado: z.boolean().optional(),
});

/** Par de tokens de sesión (US-45). */
export const sessionTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

/** Respuesta de alta/login: guardián + sesión JWT (US-45). */
export const guardianSessionSchema = guardianSchema.extend(sessionTokensSchema.shape);

/** Respuesta de alta/login pendiente de verificar el email (US-93): sin tokens. */
export const pendingVerificationSchema = guardianSchema.extend({
  requiereVerificacion: z.literal(true),
});

/**
 * Resultado de alta/login (US-93): o la sesión (con tokens) o el estado pendiente de
 * verificación. La sesión se prueba primero (tiene `accessToken`); si no, pendiente.
 */
export const authOutcomeSchema = z.union([guardianSessionSchema, pendingVerificationSchema]);

/** Respuesta del reenvío de código (US-93). */
export const resendResultSchema = z.object({ ok: z.boolean() });

/** Reto de la puerta parental del alta (US-92): pregunta legible + token firmado. */
export const parentalChallengeSchema = z.object({
  pregunta: z.string(),
  challengeToken: z.string(),
});

export const childProfileSchema = z.object({
  id: z.string(),
  guardianId: z.string(),
  nombre: z.string(),
  edad: z.number(),
  idioma: z.enum(IDIOMAS),
  avatar: z.string(),
  intereses: z.array(z.enum(TEMAS)),
});
export const childProfileListSchema = z.array(childProfileSchema);

export const storySchema = z.object({
  id: z.string(),
  profileId: z.string(),
  tema: z.enum(TEMAS),
  estilo: z.enum(ESTILOS),
  // US-69: enseñanza elegida; opcional (ausente ⇒ no se eligió ninguna).
  ensenanza: z.enum(ENSENANZAS).optional(),
  titulo: z.string(),
  cuerpo: z.string(),
  idioma: z.enum(IDIOMAS),
  estado: z.enum(['nuevo', 'leido']),
  proveedor: z.enum(PROVEEDORES_IA),
  // US-59: portada generada (data URL); opcional, ausente ⇒ respaldo local.
  portada: z.string().optional(),
  // US-101: nombre de la portada empaquetada elegida por el backend; opcional.
  portadaKey: z.string().optional(),
  // US-62: fecha de generación (ISO); opcional para no romper si el backend aún no la envía.
  creadoEn: z.string().optional(),
  // US-64: favorito; opcional para no romper hasta integrar el backend (feature A, US-63).
  favorito: z.boolean().optional(),
});

/** Cuento anónimo (US-50): sin id, profileId ni estado (no se persiste). */
export const anonymousStorySchema = z.object({
  tema: z.enum(TEMAS),
  estilo: z.enum(ESTILOS),
  titulo: z.string(),
  cuerpo: z.string(),
  idioma: z.enum(IDIOMAS),
  proveedor: z.enum(PROVEEDORES_IA),
});

export const activitySchema = z.object({
  id: z.string(),
  profileId: z.string(),
  categoria: z.enum(CATEGORIAS),
  titulo: z.string(),
  descripcion: z.string(),
  instrucciones: z.string().optional(),
  duracionMin: z.number().optional(),
  nivel: z.number().optional(),
  completadaEn: z.string().optional(),
  valoracion: z.number().optional(),
  proveedor: z.enum(PROVEEDORES_IA),
  // US-59: imagen generada (data URL); opcional, ausente ⇒ respaldo local.
  imagen: z.string().optional(),
  // US-62: fecha de generación (ISO); opcional para no romper si el backend aún no la envía.
  creadoEn: z.string().optional(),
  // US-64: favorito; opcional para no romper hasta integrar el backend (feature A, US-63).
  favorito: z.boolean().optional(),
});
export const activityListSchema = z.array(activitySchema);

/** Actividad anónima (US-50): sin id ni profileId (no se persiste). */
export const anonymousActivitySchema = z.object({
  categoria: z.enum(CATEGORIAS),
  titulo: z.string(),
  descripcion: z.string(),
  instrucciones: z.string().optional(),
  duracionMin: z.number().optional(),
  nivel: z.number().optional(),
  proveedor: z.enum(PROVEEDORES_IA),
});
export const anonymousActivityListSchema = z.array(anonymousActivitySchema);

export const historySchema = z.object({
  stories: z.array(storySchema),
  activities: z.array(activitySchema),
});

/** Logro del catálogo (US-68): estado de una medalla. */
export const achievementSchema = z.object({
  clave: z.string(),
  categoria: z.enum(CATEGORIAS_LOGRO),
  meta: z.number(),
  progreso: z.number(),
  conseguido: z.boolean(),
  desbloqueadoEn: z.string().optional(),
});
export const achievementListSchema = z.array(achievementSchema);
