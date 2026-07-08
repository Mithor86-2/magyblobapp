import type { Story } from '../domain/entities/Story.js';
import type { Activity } from '../domain/entities/Activity.js';
import type { ActivityOutput, StoryOutput } from './dto.js';

// Mapas entidad → DTO de salida, compartidos por los casos de uso de lectura.

/** Convierte una entidad `Story` en su DTO de salida (fecha en ISO; el `prompt` no se expone). */
export function toStoryOutput(story: Story): StoryOutput {
  return {
    id: story.id,
    profileId: story.profileId,
    tema: story.tema,
    estilo: story.estilo,
    ensenanza: story.ensenanza,
    titulo: story.titulo,
    cuerpo: story.cuerpo,
    idioma: story.idioma,
    estado: story.estado,
    proveedor: story.proveedor,
    portada: story.portada,
    portadaKey: story.portadaKey,
    favorito: story.favorito,
    // US-61: fecha de generación en ISO; el `prompt` NO se expone (solo BD).
    creadoEn: story.creadoEn.toISOString(),
  };
}

/** Convierte una entidad `Activity` en su DTO de salida (fechas en ISO; el `prompt` no se expone). */
export function toActivityOutput(activity: Activity): ActivityOutput {
  return {
    id: activity.id,
    profileId: activity.profileId,
    categoria: activity.categoria,
    titulo: activity.titulo,
    descripcion: activity.descripcion,
    instrucciones: activity.instrucciones,
    duracionMin: activity.duracionMin,
    nivel: activity.nivel,
    completadaEn: activity.completadaEn?.toISOString(),
    valoracion: activity.valoracion,
    proveedor: activity.proveedor,
    imagen: activity.imagen,
    favorito: activity.favorito,
    // US-61: fecha de generación en ISO; el `prompt` NO se expone (solo BD).
    creadoEn: activity.creadoEn?.toISOString(),
  };
}
