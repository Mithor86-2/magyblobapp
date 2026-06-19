import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { AuthorBadge } from '../components/AuthorBadge';
import { NarrationControls } from '../components/NarrationControls';
import { api } from '../../composition';
import { colors, radius, softShadow, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Vista de lectura de un cuento abierto desde el Historial (US-27): muestra el
 * título y el cuerpo completos y el Autor. Al abrirla marca el cuento como leído
 * (US-07/US-08), reutilizando `stories.markRead`; el Historial lo refleja al volver.
 */
export function StoryReaderScreen({ route }: RootScreenProps<'StoryReader'>) {
  const { story } = route.params;

  useEffect(() => {
    if (story.estado !== 'leido') {
      // Marca leído en segundo plano; si falla, el refresco del Historial lo corrige.
      void api.stories.markRead(story.id).catch(() => {});
    }
  }, [story.id, story.estado]);

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>{story.titulo}</Text>
        <Text style={styles.body}>{story.cuerpo}</Text>
        <NarrationControls story={story} />
        <AuthorBadge proveedor={story.proveedor} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...softShadow,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  body: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
});
