import { StyleSheet, Text, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { ParentalGate } from '../components/ParentalGate';
import { useDialog } from '../components/DialogProvider';
import { useAppStore } from '../store/useAppStore';
import { isSentryEnabled } from '../../infrastructure/sentry';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Zona de personas adultas (Fase 5.5, US-19): gestión de la sesión, separada de
 * la zona infantil y protegida por la puerta parental. Permite cambiar de perfil
 * activo y cerrar sesión. Las acciones de cuenta más completas (editar/eliminar)
 * llegan en fases posteriores (US-20/US-21).
 */
export function ParentalScreen({ navigation }: RootScreenProps<'Parental'>) {
  const guardian = useAppStore((s) => s.guardian);
  const clearProfile = useAppStore((s) => s.clearProfile);
  const logout = useAppStore((s) => s.logout);
  const dialog = useDialog();

  function onCambiarPerfil() {
    clearProfile();
    navigation.reset({ index: 0, routes: [{ name: 'SelectProfile' }] });
  }

  function onCerrarSesion() {
    dialog.confirm({
      title: 'Cerrar sesión',
      message: '¿Seguro que quieres cerrar la sesión de esta cuenta?',
      confirmLabel: 'Cerrar sesión',
      destructive: true,
      onConfirm: () => {
        logout();
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      },
    });
  }

  // Disparador de prueba dev-only para verificar la tubería de Sentry de extremo a
  // extremo (US-40). Solo bajo `__DEV__`: nunca se renderiza en builds de producción.
  function onProbarSentry() {
    Sentry.captureException(
      new Error('Evento de prueba de Sentry (dev-only) desde ParentalScreen'),
    );
    dialog.alert({
      title: 'Sentry',
      message: isSentryEnabled()
        ? 'Evento de prueba enviado. Revisa el dashboard de Sentry (Issues).'
        : 'Sentry no está activo (sin DSN): el evento no se ha enviado.',
    });
  }

  return (
    <ParentalGate intro="Esta es la zona de personas adultas. Resuelve la operación para gestionar la cuenta.">
      <Screen>
        {guardian ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Cuenta</Text>
            <Text style={styles.cardName}>
              {guardian.nombre} {guardian.apellidos}
            </Text>
            <Text style={styles.cardEmail}>{guardian.email}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <BubblyButton label="Cambiar de perfil" onPress={onCambiarPerfil} />
          <BubblyButton label="Cerrar sesión" onPress={onCerrarSesion} variant="secondary" />
          {__DEV__ ? (
            <BubblyButton
              label="Probar Sentry (dev)"
              onPress={onProbarSentry}
              variant="secondary"
            />
          ) : null}
        </View>
      </Screen>
    </ParentalGate>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardLabel: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
  },
  cardName: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  cardEmail: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  actions: {
    gap: spacing.elementGap,
    marginTop: spacing.md,
  },
});
