import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Navegación en dos niveles:
 * - Stack raíz: onboarding (bienvenida → alta o login → selección de perfil →
 *   crear perfil) y, ya con perfil activo, las pestañas principales (`Main`).
 * - Tabs (`Main`): pestañas inferiores (Inicio · Actividades · Cuentos · Historial).
 */
export type RootStackParamList = {
  Welcome: undefined;
  Consent: undefined;
  Login: undefined;
  SelectProfile: undefined;
  CreateProfile: undefined;
  Main: undefined;
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
