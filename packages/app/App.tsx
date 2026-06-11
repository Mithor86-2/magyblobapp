import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Quicksand_500Medium, Quicksand_700Bold, useFonts } from '@expo-google-fonts/quicksand';
import { ConsentScreen } from './src/screens/ConsentScreen';
import { CreateProfileScreen } from './src/screens/CreateProfileScreen';
import { StoryGeneratorScreen } from './src/screens/StoryGeneratorScreen';
import { useAppStore } from './src/store/useAppStore';
import type { RootStackParamList } from './src/navigation';
import { colors } from './src/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Espera a que la persistencia de Zustand termine de hidratar desde AsyncStorage. */
function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

export default function App() {
  const [fontsLoaded] = useFonts({ Quicksand_500Medium, Quicksand_700Bold });
  const hydrated = useStoreHydrated();
  const guardianId = useAppStore((s) => s.guardianId);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Si el adulto ya consintió en una sesión anterior, saltamos directos a crear perfil.
  const initialRoute = guardianId ? 'CreateProfile' : 'Consent';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Consent" component={ConsentScreen} />
          <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
          <Stack.Screen name="StoryGenerator" component={StoryGeneratorScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
