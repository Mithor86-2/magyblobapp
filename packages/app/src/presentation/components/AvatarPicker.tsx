import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, tapTarget } from '../theme/tokens';

/**
 * Avatares predefinidos como emojis: sin assets externos ni descargas en runtime
 * (coherente con el cumplimiento para menores). El `id` ASCII es lo que se guarda
 * en el perfil; el emoji es solo presentación.
 */
export const AVATARS: ReadonlyArray<{ id: string; emoji: string }> = [
  { id: 'zorro', emoji: '🦊' },
  { id: 'gato', emoji: '🐱' },
  { id: 'oso', emoji: '🐻' },
  { id: 'conejo', emoji: '🐰' },
  { id: 'leon', emoji: '🦁' },
  { id: 'rana', emoji: '🐸' },
  { id: 'pollito', emoji: '🐥' },
  { id: 'unicornio', emoji: '🦄' },
];

export function avatarEmoji(id: string): string {
  return AVATARS.find((a) => a.id === id)?.emoji ?? '🦊';
}

interface AvatarPickerProps {
  value: string | null;
  onChange: (id: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.grid}>
      {AVATARS.map((avatar) => {
        const selected = value === avatar.id;
        return (
          <Pressable
            key={avatar.id}
            accessibilityRole="button"
            accessibilityLabel={avatar.id}
            accessibilityState={{ selected }}
            onPress={() => onChange(avatar.id)}
            style={[styles.cell, selected ? styles.selected : styles.unselected]}
          >
            {/* El avatar elegido se anima (US-90); los demás, estáticos. */}
            {selected ? (
              <AnimatedAvatar emoji={avatar.emoji} style={styles.emoji} />
            ) : (
              <Text style={styles.emoji}>{avatar.emoji}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    cell: {
      width: tapTarget,
      height: tapTarget,
      borderRadius: radius.lg,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primary,
    },
    unselected: {
      backgroundColor: colors.surfaceContainer,
      borderColor: colors.outline,
    },
    emoji: {
      fontSize: 32,
    },
  });
