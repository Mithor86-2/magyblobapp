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
  Achievement,
  Activity,
  AnonymousActivity,
  AnonymousStory,
  ChildProfile,
  CreateChildProfileInput,
  GenerateStoryAnonymousRequest,
  GenerateStoryRequest,
  GuardianSession,
  History,
  LoginGuardianInput,
  RecommendActivitiesAnonymousRequest,
  RecommendActivitiesRequest,
  RegisterGuardianInput,
  SessionTokens,
  Story,
} from './types';

export interface GuardianGateway {
  /** Da de alta al adulto y abre sesión (auto-login): devuelve guardián + tokens. */
  register(input: RegisterGuardianInput): Promise<GuardianSession>;
  /** Identifica al adulto por su email (login ligero, US-19) y abre sesión (US-45). */
  login(input: LoginGuardianInput): Promise<GuardianSession>;
  /** Renueva el access token a partir del refresh token (US-45). */
  refresh(refreshToken: string): Promise<SessionTokens>;
}

export interface ProfileGateway {
  create(input: CreateChildProfileInput): Promise<ChildProfile>;
  /** Lista los perfiles de un guardián para elegir el activo (US-02). */
  list(guardianId: string): Promise<ChildProfile[]>;
}

export interface StoryGateway {
  generate(request: GenerateStoryRequest): Promise<Story>;
  /** Genera un cuento en modo anónimo efímero, sin sesión ni persistencia (US-50). */
  generateAnonymous(request: GenerateStoryAnonymousRequest): Promise<AnonymousStory>;
  /** Marca un cuento como leído (US-07). */
  markRead(storyId: string): Promise<Story>;
  /** Marca/desmarca un cuento como favorito (US-64); idempotente, devuelve el cuento actualizado. */
  setFavorite(storyId: string, favorito: boolean): Promise<Story>;
  /** URL del audio de narración del cuento (US-22). Constructor puro, sin red. */
  narrationUrl(storyId: string): string;
}

export interface ActivityGateway {
  recommend(request: RecommendActivitiesRequest): Promise<Activity[]>;
  /** Recomienda actividades en modo anónimo efímero, sin sesión ni persistencia (US-50). */
  recommendAnonymous(request: RecommendActivitiesAnonymousRequest): Promise<AnonymousActivity[]>;
  /** Registra una actividad como completada; la valoración 1-3 es opcional (US-10/US-72). */
  complete(activityId: string, valoracion?: number): Promise<Activity>;
  /** Marca/desmarca una actividad como favorita (US-64); idempotente, devuelve la actividad actualizada. */
  setFavorite(activityId: string, favorito: boolean): Promise<Activity>;
}

export interface HistoryGateway {
  get(profileId: string): Promise<History>;
}

export interface AchievementGateway {
  /** Catálogo de logros del perfil con su progreso y estado de desbloqueo (US-68). */
  get(profileId: string): Promise<Achievement[]>;
}

/** Conjunto de gateways que el composition root cablea y la presentación consume. */
export interface Api {
  guardians: GuardianGateway;
  profiles: ProfileGateway;
  stories: StoryGateway;
  activities: ActivityGateway;
  history: HistoryGateway;
  achievements: AchievementGateway;
}
