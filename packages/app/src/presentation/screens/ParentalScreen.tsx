import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { ParentalGate } from '../components/ParentalGate';
import { useDialog } from '../components/DialogProvider';
import { useAppStore } from '../store/useAppStore';
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

  return (
    <ParentalGate intro="Esta es la zona de personas adultas. Resuelve la operación para gestionar la cuenta.">
      <Screen
        footer={
          <BubblyButton label="Volver" onPress={() => navigation.goBack()} variant="secondary" />
        }
      >
        <Text style={styles.title}>Zona de adultos</Text>

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
        </View>
      </Screen>
    </ParentalGate>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.displayLg,
    color: colors.primary,
  },
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
