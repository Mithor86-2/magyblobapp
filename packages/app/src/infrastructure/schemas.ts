/**
 * Esquemas Zod de las respuestas del backend. Viven en `infrastructure` (no en
 * `domain`, que no admite dependencias externas): validan en la frontera HTTP lo
 * que entra por la red antes de propagarlo a la app, cerrando el agujero del cast
 * `as TResponse`. Reutilizan los vocabularios cerrados del dominio (`TEMAS`,
 * `CATEGORIAS`, …) como única fuente de verdad de los valores válidos.
 */
import { z } from 'zod';
import { CATEGORIAS, ESTILOS, IDIOMAS, PARENTESCOS, PROVEEDORES_IA, TEMAS } from '../domain/types';

export const guardianSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellidos: z.string(),
  email: z.string(),
  parentesco: z.enum(PARENTESCOS),
  consentimientoDado: z.boolean(),
});

/** Par de tokens de sesión (US-45). */
export const sessionTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

/** Respuesta de alta/login: guardián + sesión JWT (US-45). */
export const guardianSessionSchema = guardianSchema.extend(sessionTokensSchema.shape);

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
  titulo: z.string(),
  cuerpo: z.string(),
  idioma: z.enum(IDIOMAS),
  estado: z.enum(['nuevo', 'leido']),
  proveedor: z.enum(PROVEEDORES_IA),
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
