import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Quicksand_500Medium, Quicksand_700Bold, useFonts } from '@expo-google-fonts/quicksand';
import { DashboardScreen } from './src/presentation/screens/DashboardScreen';
import { WelcomeScreen } from './src/presentation/screens/WelcomeScreen';
import { ConsentScreen } from './src/presentation/screens/ConsentScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { SelectProfileScreen } from './src/presentation/screens/SelectProfileScreen';
import { ParentalScreen } from './src/presentation/screens/ParentalScreen';
import { CreateProfileScreen } from './src/presentation/screens/CreateProfileScreen';
import { StoryReaderScreen } from './src/presentation/screens/StoryReaderScreen';
import { StoryGeneratorScreen } from './src/presentation/screens/StoryGeneratorScreen';
import { ActivitiesScreen } from './src/presentation/screens/ActivitiesScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { HistoryScreen } from './src/presentation/screens/HistoryScreen';
import { DialogProvider } from './src/presentation/components/DialogProvider';
import { AppErrorBoundary } from './src/presentation/components/AppErrorBoundary';
import { Icon, type IconName } from './src/presentation/components/Icon';
import { useAppStore } from './src/presentation/store/useAppStore';
import { resolveInitialRoute } from './src/presentation/initialRoute';
import { trackNavigation } from './src/infrastructure/telemetry';
import type {
  MainTabParamList,
  RootScreenProps,
  RootStackParamList,
  TabScreenProps,
} from './src/presentation/navigation';
import { colors, fonts, radius } from './src/presentation/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Cabecera del stack con el tema de la app (botón "atrás" incluido). US-24 + US-56.
 *
 * `headerBackButtonDisplayMode: 'default'` sigue la Human Interface Guidelines de iOS:
 * el botón "atrás" muestra el título de la pantalla anterior cuando cabe (ayuda a
 * orientarse), y degrada a "Back" o solo el icono según el espacio. En iOS 26+ el título
 * de "atrás" se oculta por defecto; `'default'` recupera el comportamiento clásico y deja
 * una vuelta atrás consistente entre versiones. En Android el chevron va siempre sin
 * etiqueta (Material), así que el cambio es específico de iOS.
 */
const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { fontFamily: fonts.bold },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'default',
  headerTitleAlign: 'center',
} as const;

/**
 * Boundaries por zona (US-41): aíslan las pantallas de contenido generado para que
 * un crash en una no tumbe toda la app (las otras pestañas siguen operativas). El
 * boundary global de `App` es la red de seguridad de nivel superior.
 */
function CuentosScreen(props: TabScreenProps<'Cuentos'>) {
  return (
    <AppErrorBoundary label="cuentos">
      <StoryGeneratorScreen {...props} />
    </AppErrorBoundary>
  );
}

function ActividadesScreen(props: TabScreenProps<'Actividades'>) {
  return (
    <AppErrorBoundary label="actividades">
      <ActivitiesScreen {...props} />
    </AppErrorBoundary>
  );
}

function LecturaScreen(props: RootScreenProps<'StoryReader'>) {
  return (
    <AppErrorBoundary label="lectura">
      <StoryReaderScreen {...props} />
    </AppErrorBoundary>
  );
}

/** Icono de pestaña: icono lucide dentro de un "blob" pastel cuando está activo. */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Icon name={name} size={24} color={focused ? colors.primary : colors.onSurfaceVariant} />
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
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Actividades"
        component={ActividadesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="activities" focused={focused} /> }}
      />
      <Tab.Screen
        name="Cuentos"
        component={CuentosScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="story" focused={focused} /> }}
      />
      <Tab.Screen
        name="Historial"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="library" focused={focused} /> }}
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
  const profiles = useAppStore((s) => s.profiles);
  const setProfile = useAppStore((s) => s.setProfile);
  // Ref de la navegación para registrar breadcrumbs de pantalla (US-42).
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  // Recupera la sesión persistida y decide la ruta inicial (US-49): sin sesión →
  // onboarding; con perfil activo → pestañas; sin perfil activo pero con un único
  // hijo → auto-seleccionarlo y entrar; con 0 o varios → elegir perfil.
  const { route: initialRoute, autoSelect } = resolveInitialRoute({
    guardian,
    currentProfile,
    profiles,
  });

  // El side-effect de auto-selección se dispara fuera del render para no mutar el
  // store durante el cálculo de la ruta.
  useEffect(() => {
    if (autoSelect) setProfile(autoSelect);
  }, [autoSelect, setProfile]);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary label="app">
        <DialogProvider>
          <NavigationContainer
            ref={navigationRef}
            onStateChange={() => {
              // Breadcrumb por cambio de pantalla: solo el nombre de ruta (sin params/PII).
              const route = navigationRef.getCurrentRoute();
              if (route) trackNavigation(route.name);
            }}
          >
            <StatusBar style="dark" />
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={stackScreenOptions}>
              {/* Inicio sin sesión (US-50), bienvenida y las pestañas no llevan cabecera. */}
              <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ headerShown: false }}
              />
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
              <Stack.Screen
                name="StoryReader"
                component={LecturaScreen}
                options={{ title: 'Cuento' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </DialogProvider>
      </AppErrorBoundary>
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
});
