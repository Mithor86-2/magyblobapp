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
  AuthOutcome,
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
  /**
   * Da de alta al adulto. Abre sesión (auto-login) salvo que el backend exija
   * verificar el email antes (US-93), en cuyo caso devuelve el estado pendiente.
   */
  register(input: RegisterGuardianInput): Promise<AuthOutcome>;
  /**
   * Identifica al adulto por email + contraseña (US-48) y abre sesión (US-45), salvo
   * que la cuenta esté sin verificar (US-93), en cuyo caso devuelve el estado pendiente.
   */
  login(input: LoginGuardianInput): Promise<AuthOutcome>;
  /** Renueva el access token a partir del refresh token (US-45). */
  refresh(refreshToken: string): Promise<SessionTokens>;
  /** Valida el código OTP y, si es correcto, abre sesión (US-93). */
  verifyEmail(guardianId: string, codigo: string): Promise<GuardianSession>;
  /** Reenvía el código OTP de verificación (US-93). */
  resendVerification(guardianId: string): Promise<void>;
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
  /** Continúa un cuento existente: genera un capítulo nuevo enlazado y lo devuelve (US-78). */
  continueStory(storyId: string): Promise<Story>;
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
