/**
 * Puertos (interfaces) hacia el backend. La presentación depende de estas
 * abstracciones, no de la implementación HTTP concreta (que vive en
 * `infrastructure`). Las dependencias apuntan hacia dentro: `domain` no conoce a
 * `infrastructure` ni a `presentation`.
 *
 * Se segregan por agregado (Guardian / Profile / Story) en vez de un único
 * "cliente", para que cada pantalla dependa solo de lo que usa.
 */
import type {
  Activity,
  ChildProfile,
  CreateChildProfileInput,
  GenerateStoryRequest,
  Guardian,
  History,
  LoginGuardianInput,
  RecommendActivitiesRequest,
  RegisterGuardianInput,
  Story,
} from './types';

export interface GuardianGateway {
  register(input: RegisterGuardianInput): Promise<Guardian>;
  /** Identifica al adulto por su email (login ligero, US-19). */
  login(input: LoginGuardianInput): Promise<Guardian>;
}

export interface ProfileGateway {
  create(input: CreateChildProfileInput): Promise<ChildProfile>;
  /** Lista los perfiles de un guardián para elegir el activo (US-02). */
  list(guardianId: string): Promise<ChildProfile[]>;
}

export interface StoryGateway {
  generate(request: GenerateStoryRequest): Promise<Story>;
  /** Marca un cuento como leído (US-07). */
  markRead(storyId: string): Promise<Story>;
  /** URL del audio de narración del cuento (US-22). Constructor puro, sin red. */
  narrationUrl(storyId: string): string;
}

export interface ActivityGateway {
  recommend(request: RecommendActivitiesRequest): Promise<Activity[]>;
  /** Registra una actividad completada con valoración 1-3 (US-10). */
  complete(activityId: string, valoracion: number): Promise<Activity>;
}

export interface HistoryGateway {
  get(profileId: string): Promise<History>;
}

/** Conjunto de gateways que el composition root cablea y la presentación consume. */
export interface Api {
  guardians: GuardianGateway;
  profiles: ProfileGateway;
  stories: StoryGateway;
  activities: ActivityGateway;
  history: HistoryGateway;
}
