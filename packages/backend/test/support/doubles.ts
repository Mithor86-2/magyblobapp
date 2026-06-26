import type {
  AIProvider,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../src/domain/ai/AIProvider.js';
import type { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import type { Guardian } from '../../src/domain/entities/Guardian.js';
import type { Story } from '../../src/domain/entities/Story.js';
import type { StoryNarration } from '../../src/domain/entities/StoryNarration.js';
import type { Activity } from '../../src/domain/entities/Activity.js';
import type { InteractionEvent } from '../../src/domain/entities/InteractionEvent.js';
import type { AuditLog } from '../../src/domain/entities/AuditLog.js';
import type { ChildProfileRepository } from '../../src/domain/repositories/ChildProfileRepository.js';
import type { GuardianRepository } from '../../src/domain/repositories/GuardianRepository.js';
import type { StoryRepository } from '../../src/domain/repositories/StoryRepository.js';
import type { StoryNarrationRepository } from '../../src/domain/repositories/StoryNarrationRepository.js';
import type { ActivityRepository } from '../../src/domain/repositories/ActivityRepository.js';
import type { InteractionEventRepository } from '../../src/domain/repositories/InteractionEventRepository.js';
import type { AuditLogRepository } from '../../src/domain/repositories/AuditLogRepository.js';
import type { SettingsRepository } from '../../src/domain/repositories/SettingsRepository.js';
import type { TTSProvider, SynthesizeInput } from '../../src/domain/tts/TTSProvider.js';
import type { Clock, IdGenerator } from '../../src/application/ports.js';

/** Repositorio de adultos en memoria para tests. */
export class InMemoryGuardianRepository implements GuardianRepository {
  readonly items = new Map<string, Guardian>();

  async save(guardian: Guardian): Promise<void> {
    this.items.set(guardian.id, guardian);
  }

  async findById(id: string): Promise<Guardian | null> {
    return this.items.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<Guardian | null> {
    for (const g of this.items.values()) {
      if (g.email === email) return g;
    }
    return null;
  }
}

/** Repositorio de perfiles en memoria para tests. */
export class InMemoryChildProfileRepository implements ChildProfileRepository {
  readonly items = new Map<string, ChildProfile>();

  async save(profile: ChildProfile): Promise<void> {
    this.items.set(profile.id, profile);
  }

  async findById(id: string): Promise<ChildProfile | null> {
    return this.items.get(id) ?? null;
  }

  async findByGuardian(guardianId: string): Promise<ChildProfile[]> {
    return [...this.items.values()].filter((p) => p.guardianId === guardianId);
  }
}

/** Repositorio de cuentos en memoria para tests. */
export class InMemoryStoryRepository implements StoryRepository {
  readonly items = new Map<string, Story>();

  async save(story: Story): Promise<void> {
    this.items.set(story.id, story);
  }

  async findById(id: string): Promise<Story | null> {
    return this.items.get(id) ?? null;
  }

  async findByProfile(profileId: string): Promise<Story[]> {
    return [...this.items.values()]
      .filter((s) => s.profileId === profileId)
      .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime());
  }
}

/** Repositorio de narraciones en memoria para tests. */
export class InMemoryStoryNarrationRepository implements StoryNarrationRepository {
  readonly items = new Map<string, StoryNarration>();

  async findByStory(storyId: string): Promise<StoryNarration | null> {
    return this.items.get(storyId) ?? null;
  }

  async save(narration: StoryNarration): Promise<void> {
    this.items.set(narration.storyId, narration);
  }
}

/** Repositorio de actividades en memoria para tests. */
export class InMemoryActivityRepository implements ActivityRepository {
  readonly items = new Map<string, Activity>();

  async save(activity: Activity): Promise<void> {
    this.items.set(activity.id, activity);
  }

  async findById(id: string): Promise<Activity | null> {
    return this.items.get(id) ?? null;
  }

  async findByProfile(profileId: string): Promise<Activity[]> {
    return [...this.items.values()].filter((a) => a.profileId === profileId);
  }
}

/** Repositorio de eventos en memoria para tests. */
export class InMemoryInteractionEventRepository implements InteractionEventRepository {
  readonly items: InteractionEvent[] = [];

  async save(event: InteractionEvent): Promise<void> {
    this.items.push(event);
  }
}

/** Repositorio de auditoría en memoria para tests. */
export class InMemoryAuditLogRepository implements AuditLogRepository {
  readonly items: AuditLog[] = [];

  async save(entry: AuditLog): Promise<void> {
    this.items.push(entry);
  }
}

/** Settings en memoria: solo lo que se le ponga; si falta la clave devuelve null. */
export class InMemorySettingsRepository implements SettingsRepository {
  constructor(private readonly map: Map<string, string> = new Map()) {}

  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
}

/** AIProvider falso, determinista: no necesita Ollama. */
export class FakeAIProvider implements AIProvider {
  async generateStory(input: GenerateStoryInput) {
    return {
      titulo: `Cuento de ${input.perfil.nombre} sobre ${input.temas.join(', ')}`,
      cuerpo: `Había una vez una historia ${input.estilos.join(', ')} en ${input.perfil.idioma.value}.`,
      proveedor: 'mock' as const,
    };
  }

  async recommendActivities(input: RecommendActivitiesInput) {
    return Array.from({ length: input.cantidad }, (_unused, i) => ({
      categoria: input.categoria ?? ('arte' as const),
      titulo: `Actividad ${i + 1}`,
      descripcion: `Para ${input.perfil.nombre}.`,
      proveedor: 'mock' as const,
    }));
  }
}

/** TTSProvider falso, determinista: no llama a ElevenLabs. Cuenta las síntesis. */
export class FakeTTSProvider implements TTSProvider {
  llamadas = 0;
  constructor(private readonly voiceId = 'voz-fake') {}

  async synthesize(input: SynthesizeInput) {
    this.llamadas += 1;
    // MP3 de juguete: bytes derivados del texto, suficientes para asertar no-vacío.
    return {
      mp3: new TextEncoder().encode(`mp3:${input.idioma}:${input.texto}`),
      voiceId: this.voiceId,
    };
  }
}

/** TTSProvider que siempre falla; simula ElevenLabs caído / clave ausente. */
export class FailingTTSProvider implements TTSProvider {
  async synthesize(): Promise<never> {
    throw new Error('ElevenLabs no disponible (test).');
  }
}

/** Generador de ids secuencial y determinista. */
export function secuencialIdGenerator(prefijo = 'id'): IdGenerator {
  let n = 0;
  return () => `${prefijo}-${++n}`;
}

/** Reloj fijo para tests deterministas. */
export function relojFijo(iso = '2026-06-10T12:00:00.000Z'): Clock {
  const fecha = new Date(iso);
  return () => fecha;
}
