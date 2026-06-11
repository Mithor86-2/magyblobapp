import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Rutas del slice vertical: consentimiento → crear perfil → generar cuento. */
export type RootStackParamList = {
  Consent: undefined;
  CreateProfile: undefined;
  StoryGenerator: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
