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
  ChildProfile,
  CreateChildProfileInput,
  GenerateStoryRequest,
  Guardian,
  RegisterGuardianInput,
  Story,
} from './types';

export interface GuardianGateway {
  register(input: RegisterGuardianInput): Promise<Guardian>;
}

export interface ProfileGateway {
  create(input: CreateChildProfileInput): Promise<ChildProfile>;
}

export interface StoryGateway {
  generate(request: GenerateStoryRequest): Promise<Story>;
}

/** Conjunto de gateways que el composition root cablea y la presentación consume. */
export interface Api {
  guardians: GuardianGateway;
  profiles: ProfileGateway;
  stories: StoryGateway;
}
