import { registerRootComponent } from 'expo';
import * as Sentry from '@sentry/react-native';

import App from './App';
import { initSentry } from './src/infrastructure/sentry.bootstrap';

// Monitorización de errores/crashes (US-40). Init condicional al DSN: sin
// EXPO_PUBLIC_SENTRY_DSN no se inicializa y no sale nada a terceros (modo conforme).
// Se llama antes de registrar el componente raíz para capturar fallos tempranos.
initSentry();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately. Sentry.wrap habilita el error boundary
// y el seguimiento nativo cuando Sentry está activo (no-op si no se inicializó).
registerRootComponent(Sentry.wrap(App));
