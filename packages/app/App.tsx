import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Quicksand_500Medium, Quicksand_700Bold, useFonts } from '@expo-google-fonts/quicksand';
import { WelcomeScreen } from './src/presentation/screens/WelcomeScreen';
import { ConsentScreen } from './src/presentation/screens/ConsentScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { SelectProfileScreen } from './src/presentation/screens/SelectProfileScreen';
import { ParentalScreen } from './src/presentation/screens/ParentalScreen';
import { CreateProfileScreen } from './src/presentation/screens/CreateProfileScreen';
import { StoryGeneratorScreen } from './src/presentation/screens/StoryGeneratorScreen';
import { ActivitiesScreen } from './src/presentation/screens/ActivitiesScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { HistoryScreen } from './src/presentation/screens/HistoryScreen';
import { DialogProvider } from './src/presentation/components/DialogProvider';
import { useAppStore } from './src/presentation/store/useAppStore';
import type { MainTabParamList, RootStackParamList } from './src/presentation/navigation';
import { colors, fonts, radius } from './src/presentation/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/** Cabecera del stack con el tema de la app (botón "atrás" incluido). US-24. */
const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { fontFamily: fonts.bold },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  headerTitleAlign: 'center',
} as const;

/** Icono de pestaña: emoji dentro de un "blob" pastel cuando está activo. */
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.outline },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 13 },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Actividades"
        component={ActivitiesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎨" focused={focused} /> }}
      />
      <Tab.Screen
        name="Cuentos"
        component={StoryGeneratorScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} /> }}
      />
      <Tab.Screen
        name="Historial"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

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
  const guardian = useAppStore((s) => s.guardian);
  const currentProfile = useAppStore((s) => s.currentProfile);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Recupera la sesión persistida: con guardián y perfil activo entra directo a
  // las pestañas; con guardián pero sin perfil, a elegir entre sus hijos; sin
  // sesión, al onboarding.
  const initialRoute = guardian ? (currentProfile ? 'Main' : 'SelectProfile') : 'Welcome';

  return (
    <SafeAreaProvider>
      <DialogProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator initialRouteName={initialRoute} screenOptions={stackScreenOptions}>
            {/* Bienvenida (inicial) y las pestañas no llevan cabecera del stack. */}
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Consent"
              component={ConsentScreen}
              options={{ title: 'Crear cuenta' }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Iniciar sesión' }}
            />
            <Stack.Screen
              name="SelectProfile"
              component={SelectProfileScreen}
              options={{ title: 'Elegir perfil' }}
            />
            <Stack.Screen
              name="CreateProfile"
              component={CreateProfileScreen}
              options={{ title: 'Crear perfil' }}
            />
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Parental"
              component={ParentalScreen}
              options={{ title: 'Zona de adultos' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </DialogProvider>
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
  tabIcon: {
    width: 56,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.secondaryContainer,
  },
  tabEmoji: {
    fontSize: 22,
  },
});
