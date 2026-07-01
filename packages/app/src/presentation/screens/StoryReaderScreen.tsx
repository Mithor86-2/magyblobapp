import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AuthorBadge } from '../components/AuthorBadge';
import { BubblyButton } from '../components/BubblyButton';
import { FavoriteButton } from '../components/FavoriteButton';
import { Icon } from '../components/Icon';
import { NarrationControls } from '../components/NarrationControls';
import { StoryCover } from '../components/StoryCover';
import { formatearFecha } from '../formatFecha';
import { DEFAULT_APP_LANGUAGE, esIdiomaApp } from '../../i18n';
import { api } from '../../composition';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, makeSoftShadow, radius, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Vista de lectura de un cuento abierto desde el Historial (US-27): muestra el
 * título y el cuerpo completos y el Autor. El marcado como leído (US-07/US-08) es
 * **explícito** (A2): con el botón "Marcar como leído" o al escuchar la narración
 * completa; ya no se marca solo por abrir la vista, para que "leído" refleje lectura
 * o escucha real (relevante para los logros, US-68).
 */
export function StoryReaderScreen({ route }: RootScreenProps<'StoryReader'>) {
  const { story } = route.params;
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Fecha de generación localizada (US-62); ausente o inválida ⇒ no se muestra.
  const idioma = esIdiomaApp(i18n.language) ? i18n.language : DEFAULT_APP_LANGUAGE;
  const fecha = formatearFecha(story.creadoEn, idioma);

  const [leido, setLeido] = useState(story.estado === 'leido');

  // Marca el cuento como leído (idempotente): optimista en la UI; si falla, el
  // refresco del Historial lo corregirá. Lo usan el botón y el fin de la narración.
  const marcarLeido = useCallback(() => {
    if (leido) return;
    setLeido(true);
    void api.stories.markRead(story.id).catch(() => {});
  }, [leido, story.id]);

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
        <NarrationControls story={story} onFinished={marcarLeido} />
        {leido ? (
          <View style={styles.leidoRow}>
            <Icon name="check" size="sm" color={colors.tertiary} />
            <Text style={styles.leidoText}>{t('reader.alreadyRead')}</Text>
          </View>
        ) : (
          <BubblyButton
            label={t('reader.markRead')}
            icon="check"
            variant="accent"
            onPress={marcarLeido}
          />
        )}
        <AuthorBadge proveedor={story.proveedor} />
        {fecha ? <Text style={styles.fecha}>{t('common.generatedOn', { fecha })}</Text> : null}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...makeSoftShadow(colors),
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
    leidoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    leidoText: {
      ...typography.labelBold,
      color: colors.tertiary,
    },
    fecha: {
      ...typography.labelBold,
      color: colors.onSurfaceVariant,
    },
  });
