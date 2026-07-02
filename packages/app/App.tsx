import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Quicksand_500Medium, Quicksand_700Bold, useFonts } from '@expo-google-fonts/quicksand';
import { DashboardScreen } from './src/presentation/screens/DashboardScreen';
import { WelcomeScreen } from './src/presentation/screens/WelcomeScreen';
import { ConsentScreen } from './src/presentation/screens/ConsentScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { SelectProfileScreen } from './src/presentation/screens/SelectProfileScreen';
import { ParentalScreen } from './src/presentation/screens/ParentalScreen';
import { AchievementsScreen } from './src/presentation/screens/AchievementsScreen';
import { CreateProfileScreen } from './src/presentation/screens/CreateProfileScreen';
import { StoryReaderScreen } from './src/presentation/screens/StoryReaderScreen';
import { SearchResultsScreen } from './src/presentation/screens/SearchResultsScreen';
import { StoryGeneratorScreen } from './src/presentation/screens/StoryGeneratorScreen';
import { ActivitiesScreen } from './src/presentation/screens/ActivitiesScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { HistoryScreen } from './src/presentation/screens/HistoryScreen';
import { DialogProvider } from './src/presentation/components/DialogProvider';
import { AppErrorBoundary } from './src/presentation/components/AppErrorBoundary';
import { Icon, type IconName } from './src/presentation/components/Icon';
import { useAppStore } from './src/presentation/store/useAppStore';
import './src/i18n';
import { resolveInitialRoute } from './src/presentation/initialRoute';
import { makeTabBarStyle } from './src/presentation/tabBarStyle';
import { trackNavigation } from './src/infrastructure/telemetry';
import type {
  MainTabParamList,
  RootScreenProps,
  RootStackParamList,
  TabScreenProps,
} from './src/presentation/navigation';
import { ThemeProvider, useTheme } from './src/presentation/theme/ThemeProvider';
import { type ColorTokens, fonts, radius } from './src/presentation/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Cabecera del stack con el tema de la app (botón "atrás" incluido). US-24 + US-56 + US-66.
 *
 * `headerBackButtonDisplayMode: 'default'` sigue la Human Interface Guidelines de iOS:
 * el botón "atrás" muestra el título de la pantalla anterior cuando cabe (ayuda a
 * orientarse), y degrada a "Back" o solo el icono según el espacio. En iOS 26+ el título
 * de "atrás" se oculta por defecto; `'default'` recupera el comportamiento clásico y deja
 * una vuelta atrás consistente entre versiones. En Android el chevron va siempre sin
 * etiqueta (Material), así que el cambio es específico de iOS.
 *
 * Los colores se derivan de la paleta activa (US-66) para que cabecera y fondo sigan
 * al tema claro/oscuro.
 */
function makeStackScreenOptions(colors: ColorTokens) {
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.primary,
    headerTitleStyle: { fontFamily: fonts.bold },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'default',
    headerTitleAlign: 'center',
  } as const;
}

/** Tema de React Navigation derivado de la paleta activa (fondos, tarjetas, texto; US-66). */
function makeNavigationTheme(colors: ColorTokens, scheme: 'light' | 'dark'): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.surface,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outline,
    },
  };
}

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

/**
 * Icono de pestaña: icono lucide coloreado según el estado. El resaltado del activo ya
 * NO es un "blob" alrededor del icono: el fondo activo lo pinta el navegador sobre TODO
 * el botón (icono + etiqueta), vía `tabBarActiveBackgroundColor` + `tabBarItemStyle`
 * redondeado (US-88 #7).
 */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const { colors } = useTheme();
  return <Icon name={name} size={24} color={focused ? colors.primary : colors.onSurfaceVariant} />;
}

function MainTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  // #8: reservar el inset inferior del sistema (edge-to-edge de Android en SDK 54+) para
  // que las pestañas activas no queden bajo la barra de navegación del sistema.
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        // #7: el fondo del ítem activo cubre todo el botón; con el itemStyle redondeado y
        // márgenes queda como una "píldora" que envuelve icono + etiqueta.
        tabBarActiveBackgroundColor: colors.secondaryContainer,
        tabBarItemStyle: {
          marginHorizontal: 8,
          marginVertical: 6,
          borderRadius: radius.lg,
        },
        tabBarStyle: makeTabBarStyle(insets, colors),
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 13 },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.inicio'),
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Actividades"
        component={ActividadesScreen}
        options={{
          tabBarLabel: t('tabs.actividades'),
          tabBarIcon: ({ focused }) => <TabIcon name="activities" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Cuentos"
        component={CuentosScreen}
        options={{
          tabBarLabel: t('tabs.cuentos'),
          tabBarIcon: ({ focused }) => <TabIcon name="story" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Historial"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('tabs.historial'),
          tabBarIcon: ({ focused }) => <TabIcon name="library" focused={focused} />,
        }}
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

/**
 * Cuerpo de la app **bajo el `ThemeProvider`** (US-66): consume la paleta activa
 * para tematizar splash, barra de estado, navegación, cabeceras y pestañas. Se
 * separa del `App` raíz porque necesita `useTheme()`, que solo existe dentro del
 * provider.
 */
function ThemedApp() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const [fontsLoaded] = useFonts({ Quicksand_500Medium, Quicksand_700Bold });
  const hydrated = useStoreHydrated();
  const guardian = useAppStore((s) => s.guardian);
  const currentProfile = useAppStore((s) => s.currentProfile);
  const profiles = useAppStore((s) => s.profiles);
  const setProfile = useAppStore((s) => s.setProfile);
  // Ref de la navegación para registrar breadcrumbs de pantalla (US-42).
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const styles = makeStyles(colors);

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
    <AppErrorBoundary label="app">
      <DialogProvider>
        <NavigationContainer
          ref={navigationRef}
          theme={makeNavigationTheme(colors, scheme)}
          onStateChange={() => {
            // Breadcrumb por cambio de pantalla: solo el nombre de ruta (sin params/PII).
            const route = navigationRef.getCurrentRoute();
            if (route) trackNavigation(route.name);
          }}
        >
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={makeStackScreenOptions(colors)}
          >
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
              options={{ title: t('nav.consent') }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: t('nav.login') }}
            />
            <Stack.Screen
              name="SelectProfile"
              component={SelectProfileScreen}
              options={{ title: t('nav.selectProfile') }}
            />
            <Stack.Screen
              name="CreateProfile"
              component={CreateProfileScreen}
              options={{ title: t('nav.createProfile') }}
            />
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Parental"
              component={ParentalScreen}
              options={{ title: t('nav.parental') }}
            />
            <Stack.Screen
              name="Achievements"
              component={AchievementsScreen}
              options={{ title: t('nav.achievements') }}
            />
            <Stack.Screen
              name="StoryReader"
              component={LecturaScreen}
              options={{ title: t('nav.storyReader') }}
            />
            <Stack.Screen
              name="SearchResults"
              component={SearchResultsScreen}
              options={{ title: t('nav.search') }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </DialogProvider>
    </AppErrorBoundary>
  );
}

/**
 * Raíz de la app: monta los providers de nivel superior. El `ThemeProvider`
 * (US-66) envuelve todo el árbol dentro del `SafeAreaProvider` para que la paleta
 * activa (claro/oscuro según la preferencia + el SO) esté disponible en toda la
 * presentación, incluidas las barras del sistema.
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    splash: {
      flex: 1,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
