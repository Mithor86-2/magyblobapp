import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AuthorBadge } from '../components/AuthorBadge';
import { BookPages } from '../components/BookPages';
import { BubblyButton } from '../components/BubblyButton';
import { FavoriteButton } from '../components/FavoriteButton';
import { Icon } from '../components/Icon';
import { NarrationControls } from '../components/NarrationControls';
import { StoryCover } from '../components/StoryCover';
import { paginarCuento } from './paginarCuento';
import { formatearFecha } from '../formatFecha';
import { DEFAULT_APP_LANGUAGE, esIdiomaApp } from '../../i18n';
import { ApiError } from '../../domain/errors';
import { api } from '../../composition';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, makeSoftShadow, radius, spacing, typography } from '../theme/tokens';
import type { RootScreenProps } from '../navigation';

/**
 * Vista de lectura de un cuento, abierta desde el Historial (US-27) o tras generarlo
 * (A1/US-73). Muestra el título, el Autor y el cuerpo **paginado como un libro**
 * (A2/US-73, `BookPages` + `paginarCuento`) para leerlo pasando página. El marcado
 * como leído (US-07/US-08) es **explícito** (A2): con el botón "Marcar como leído" o
 * al escuchar la narración completa; ya no se marca solo por abrir la vista, para que
 * "leído" refleje lectura o escucha real (relevante para los logros, US-68).
 */
export function StoryReaderScreen({ route, navigation }: RootScreenProps<'StoryReader'>) {
  const { story } = route.params;
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Fecha de generación localizada (US-62); ausente o inválida ⇒ no se muestra.
  const idioma = esIdiomaApp(i18n.language) ? i18n.language : DEFAULT_APP_LANGUAGE;
  const fecha = formatearFecha(story.creadoEn, idioma);

  const [leido, setLeido] = useState(story.estado === 'leido');
  // US-78: "Continuar la historia" — genera un capítulo nuevo y abre su lector.
  const [continuando, setContinuando] = useState(false);
  const [errorContinuar, setErrorContinuar] = useState<string | null>(null);

  const continuar = useCallback(async () => {
    setContinuando(true);
    setErrorContinuar(null);
    try {
      const siguiente = await api.stories.continueStory(story.id);
      navigation.push('StoryReader', { story: siguiente });
    } catch (e) {
      setErrorContinuar(e instanceof ApiError ? e.message : t('reader.continueError'));
    } finally {
      setContinuando(false);
    }
  }, [story.id, navigation, t]);

  // Marca el cuento como leído (idempotente): optimista en la UI; si falla, el
  // refresco del Historial lo corregirá. Lo usan el botón y el fin de la narración.
  const marcarLeido = useCallback(() => {
    if (leido) return;
    setLeido(true);
    void api.stories.markRead(story.id).catch(() => {});
  }, [leido, story.id]);

  // US-83 (#5): la 1ª página del libro es la portada (imagen + título); luego la
  // historia paginada y, al final, una página "FIN".
  const portada = (
    <>
      <StoryCover
        generada={story.portada}
        tema={story.tema}
        style={styles.cover}
        accessibilityLabel={story.titulo}
      />
      <Text style={styles.coverTitle}>{story.titulo}</Text>
    </>
  );

  return (
    <Screen>
      <View style={styles.card}>
        <View style={styles.favoriteRow}>
          <FavoriteButton
            favorito={story.favorito}
            onToggle={(favorito) => api.stories.setFavorite(story.id, favorito)}
          />
        </View>
        {/* US-83 (#1/#5): el cuento se lee como un libro — portada con título, la historia
            paginada y una página final con la portada y "¡Fin de la historia!". */}
        <BookPages
          paginas={paginarCuento(story.cuerpo)}
          portada={portada}
          finLabel={t('reader.end')}
          finImagen={
            <StoryCover
              generada={story.portada}
              tema={story.tema}
              style={styles.coverFin}
              accessibilityLabel={story.titulo}
            />
          }
        />
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
        {/* US-78: continuar la historia con un capítulo nuevo generado por IA. */}
        <BubblyButton
          label={t('reader.continueStory')}
          icon="arrow-right"
          variant="secondary"
          onPress={continuar}
          loading={continuando}
        />
        {errorContinuar ? <Text style={styles.errorContinuar}>{errorContinuar}</Text> : null}
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
    favoriteRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    // La portada vive DENTRO de la hoja del libro (fondo blanco): imagen + título.
    cover: {
      width: '100%',
      height: 200,
      borderRadius: radius.md,
    },
    coverTitle: {
      ...typography.headlineMd,
      // Texto oscuro fijo para contrastar sobre la hoja blanca en cualquier tema.
      color: '#1a1a1a',
      textAlign: 'center',
    },
    // Portada (más pequeña) que también se muestra en la página final "¡Fin de la historia!".
    coverFin: {
      width: '70%',
      height: 150,
      borderRadius: radius.md,
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
    errorContinuar: {
      ...typography.labelBold,
      color: colors.error,
      textAlign: 'center',
    },
  });
