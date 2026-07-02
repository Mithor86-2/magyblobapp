import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { Story } from '../domain/types';

/**
 * Navegación en dos niveles:
 * - Stack raíz: onboarding (bienvenida → alta o login → selección de perfil →
 *   crear perfil) y, ya con perfil activo, las pestañas principales (`Main`).
 * - Tabs (`Main`): pestañas inferiores (Inicio · Actividades · Cuentos · Historial).
 */
export type RootStackParamList = {
  /** Inicio sin sesión (US-50): explica la app y permite probar cuentos/actividades efímeros. */
  Dashboard: undefined;
  Welcome: undefined;
  Consent: undefined;
  Login: undefined;
  SelectProfile: undefined;
  CreateProfile: undefined;
  Main: undefined;
  Parental: undefined;
  /** Vitrina de logros del perfil, abierta desde Inicio (US-68). */
  Achievements: undefined;
  /** Vista de lectura de un cuento abierto desde el Historial (US-27). */
  StoryReader: { story: Story };
  /** Búsqueda global (cuentos + actividades) del perfil activo (US-82). */
  SearchResults: undefined;
};

export type MainTabParamList = {
  Inicio: undefined;
  Actividades: undefined;
  Cuentos: undefined;
  Historial: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;
