import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BubblyButton } from '../components/BubblyButton';
import { avatarEmoji } from '../components/AvatarPicker';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, typography } from '../theme/tokens';
import type { TabScreenProps } from '../navigation';

/** Pantalla de bienvenida: saluda al niño actual y lleva a Cuentos / Actividades. */
export function HomeScreen({ navigation }: TabScreenProps<'Inicio'>) {
  const profile = useAppStore((s) => s.currentProfile);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.avatar}>{profile ? avatarEmoji(profile.avatar) : '✨'}</Text>
        <Text style={styles.title}>¡Hola{profile ? `, ${profile.nombre}` : ''}!</Text>
        <Text style={styles.subtitle}>
          Vamos a aprender y jugar juntos. Elige un cuento mágico o una actividad para hoy.
        </Text>
      </View>

      <View style={styles.actions}>
        <BubblyButton label="Crear un cuento" onPress={() => navigation.navigate('Cuentos')} />
        <BubblyButton
          label="Ver actividades"
          onPress={() => navigation.navigate('Actividades')}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  avatar: {
    fontSize: 80,
  },
  title: {
    ...typography.displayLg,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.elementGap,
    marginTop: spacing.lg,
  },
});
