import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AuthorBadge } from '../components/AuthorBadge';
import { FavoriteButton } from '../components/FavoriteButton';
import { NarrationControls } from '../components/NarrationControls';
import { StoryCover } from '../components/StoryCover';
import { formatearFecha } from '../formatFecha';
import { DEFAULT_APP_LANGUAGE, esIdiomaApp } from '../../i18n';
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
  const { t, i18n } = useTranslation();
  // Fecha de generación localizada (US-62); ausente o inválida ⇒ no se muestra.
  const idioma = esIdiomaApp(i18n.language) ? i18n.language : DEFAULT_APP_LANGUAGE;
  const fecha = formatearFecha(story.creadoEn, idioma);

  useEffect(() => {
    if (story.estado !== 'leido') {
      // Marca leído en segundo plano; si falla, el refresco del Historial lo corrige.
      void api.stories.markRead(story.id).catch(() => {});
    }
  }, [story.id, story.estado]);

  return (
    <Screen>
      <View style={styles.card}>
        <StoryCover
          generada={story.portada}
          tema={story.tema}
          style={styles.cover}
          accessibilityLabel={story.titulo}
        />
        <View style={styles.titleRow}>
          <Text style={styles.title}>{story.titulo}</Text>
          <FavoriteButton
            favorito={story.favorito}
            onToggle={(favorito) => api.stories.setFavorite(story.id, favorito)}
          />
        </View>
        <Text style={styles.body}>{story.cuerpo}</Text>
        <NarrationControls story={story} />
        <AuthorBadge proveedor={story.proveedor} />
        {fecha ? <Text style={styles.fecha}>{t('common.generatedOn', { fecha })}</Text> : null}
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
  cover: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    flex: 1,
  },
  body: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  fecha: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
  },
});
