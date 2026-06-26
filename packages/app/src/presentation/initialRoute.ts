/**
 * Decisión de la ruta inicial del app al arrancar (US-49). Lógica de presentación
 * pura (sin IO ni navegación montada) para poder probar los cuatro caminos sin el
 * `NavigationContainer`.
 *
 * Reglas (US-49, amplía US-02):
 * - Sin sesión (`guardian` nulo) → `Welcome` (onboarding).
 * - Con sesión y perfil activo persistido → `Main` (entra directo a las pestañas).
 * - Con sesión, sin perfil activo y **exactamente 1** perfil → auto-seleccionar ese
 *   perfil y entrar a `Main`.
 * - Con sesión, sin perfil activo y **0 o más de 1** perfiles → `SelectProfile`
 *   (la pantalla invita a crear el primero si la lista está vacía).
 */
import type { ChildProfile, Guardian } from '../domain/types';
import type { RootStackParamList } from './navigation';

type InitialRoute = keyof RootStackParamList;

interface ResolveInitialRouteInput {
  guardian: Guardian | null;
  currentProfile: ChildProfile | null;
  profiles: ChildProfile[];
}

interface ResolveInitialRouteResult {
  /** Ruta inicial del stack raíz. */
  route: InitialRoute;
  /**
   * Perfil a auto-seleccionar antes de entrar (único hijo del guardián), o `null`
   * si no procede. El efecto de selección (`setProfile`) lo dispara quien llama.
   */
  autoSelect: ChildProfile | null;
}

export function resolveInitialRoute({
  guardian,
  currentProfile,
  profiles,
}: ResolveInitialRouteInput): ResolveInitialRouteResult {
  if (!guardian) return { route: 'Welcome', autoSelect: null };
  if (currentProfile) return { route: 'Main', autoSelect: null };
  if (profiles.length === 1) return { route: 'Main', autoSelect: profiles[0] };
  return { route: 'SelectProfile', autoSelect: null };
}
