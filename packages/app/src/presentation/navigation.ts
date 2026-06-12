import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Navegación en dos niveles:
 * - Stack raíz: onboarding (consentimiento → crear perfil) y, ya con perfil, las
 *   pestañas principales (`Main`).
 * - Tabs (`Main`): pestañas inferiores. En esta feature, Cuentos y Actividades;
 *   Inicio e Historial se añaden en la siguiente.
 */
export type RootStackParamList = {
  Consent: undefined;
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
