import type { AIProvider } from '../../domain/ai/AIProvider.js';
import { Story } from '../../domain/entities/Story.js';
import { NotFoundError } from '../../domain/errors.js';
import type { ChildProfileRepository } from '../../domain/repositories/ChildProfileRepository.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import type { Clock, IdGenerator } from '../ports.js';
import type { StoryOutput } from '../dto.js';
import { toStoryOutput } from '../mappers.js';

export interface ContinueStoryDeps {
  profiles: ChildProfileRepository;
  stories: StoryRepository;
  ai: AIProvider;
  newId: IdGenerator;
  now: Clock;
}

/** Cuántos caracteres del cuento origen se pasan como contexto de la continuación. */
const MAX_CONTEXTO = 1200;

/**
 * Continúa un cuento existente generando un capítulo nuevo (US-78). Carga el cuento
 * origen y su perfil, pasa el cuerpo previo como contexto al `AIProvider`, y persiste
 * un `Story` **nuevo** enlazado al original (`continuacionDe`), heredando tema, estilo
 * y enseñanza. El cuento sigue en el idioma del perfil. La continuación reutiliza la
 * portada del origen (misma temática) para no requerir otra llamada de imagen.
 */
export class ContinueStory {
  constructor(private readonly deps: ContinueStoryDeps) {}

  async execute(input: { storyId: string }): Promise<StoryOutput> {
    const origen = await this.deps.stories.findById(input.storyId);
    if (!origen) {
      throw new NotFoundError(`No existe el cuento con id "${input.storyId}".`);
    }

    const perfil = await this.deps.profiles.findById(origen.profileId);
    if (!perfil) {
      throw new NotFoundError(`No existe el perfil con id "${origen.profileId}".`);
    }

    const generado = await this.deps.ai.generateStory({
      perfil,
      temas: [origen.tema],
      estilos: [origen.estilo],
      ensenanza: origen.ensenanza,
      contexto: recortarContexto(origen.cuerpo),
    });

    const story = new Story({
      id: this.deps.newId(),
      profileId: perfil.id,
      tema: origen.tema,
      estilo: origen.estilo,
      ensenanza: origen.ensenanza,
      titulo: generado.titulo,
      cuerpo: generado.cuerpo,
      idioma: perfil.idioma.value,
      proveedor: generado.proveedor,
      // Reutiliza la portada del origen (misma temática); si el origen no tenía, queda
      // undefined y la app cae al respaldo local por tema.
      portada: origen.portada,
      prompt: generado.prompt,
      // US-78: enlace al cuento del que es continuación (encadena capítulos).
      continuacionDe: origen.id,
      estado: 'nuevo',
      creadoEn: this.deps.now(),
    });

    await this.deps.stories.save(story);

    return toStoryOutput(story);
  }
}

/** Recorta el cuerpo del cuento origen a un contexto manejable para el prompt (US-78). */
function recortarContexto(cuerpo: string): string {
  const limpio = cuerpo.trim();
  if (limpio.length <= MAX_CONTEXTO) return limpio;
  // Conserva el final del cuento (lo más relevante para continuar) sin cortar palabras.
  return limpio.slice(limpio.length - MAX_CONTEXTO).replace(/^\S*\s/, '');
}
