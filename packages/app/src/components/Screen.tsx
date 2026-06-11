import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/tokens';

/**
 * Lienzo base de cada pantalla: fondo crema, márgenes seguros de 24px y scroll.
 * `footer` queda fijo abajo (acción principal siempre alcanzable con el pulgar).
 */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.containerPadding,
    gap: spacing.md,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.containerPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
});
