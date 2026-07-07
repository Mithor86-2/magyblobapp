import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AuthorBadge } from '../components/AuthorBadge';
import { BookPages } from '../components/BookPages';
import { BubblyButton } from '../components/BubblyButton';
import { useDialog } from '../components/DialogProvider';
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
  const { story, anonimo } = route.params;
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const dialog = useDialog();
  const styles = useThemedStyles(makeStyles);
  // Fecha de generación localizada (US-62); ausente o inválida ⇒ no se muestra.
  const idioma = esIdiomaApp(i18n.language) ? i18n.language : DEFAULT_APP_LANGUAGE;
  const fecha = formatearFecha(story.creadoEn, idioma);

  // US-96: en modo anónimo (cuento generado sin sesión) las acciones que requieren
  // cuenta —escuchar, marcar leído, guardar como favorito, continuar— no operan:
  // abren una modal que invita a crear cuenta y lleva al alta (pantalla `Consent`).
  const pedirCuenta = useCallback(() => {
    dialog.confirm({
      title: t('reader.signInRequiredTitle'),
      message: t('reader.signInRequiredBody'),
      confirmLabel: t('reader.signInRequiredConfirm'),
      cancelLabel: t('reader.signInRequiredCancel'),
      onConfirm: () => navigation.navigate('Consent'),
    });
  }, [dialog, t, navigation]);

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

  // Temporizador de la modal de fin: se limpia al desmontar para no abrir el diálogo
  // si se navega atrás durante el medio segundo de espera.
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    },
    [],
  );

  // Al llegar a la última página (US-27): si aún no está leído, pregunta con una modal
  // —**medio segundo después** de mostrarse la página, para que se vea el final antes—
  // si marcarlo como leído y, al confirmar, lo marca. Si ya lo está, no molesta.
  const alLlegarFinal = useCallback(() => {
    // US-96: en modo anónimo no se auto-ofrece marcar como leído (requiere cuenta).
    if (anonimo || leido) return;
    modalTimerRef.current = setTimeout(() => {
      dialog.confirm({
        title: t('reader.markReadPromptTitle'),
        message: t('reader.markReadPromptBody'),
        confirmLabel: t('reader.markReadPromptConfirm'),
        cancelLabel: t('reader.markReadPromptCancel'),
        onConfirm: marcarLeido,
      });
    }, 500);
  }, [anonimo, leido, dialog, t, marcarLeido]);

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
    <Screen tightTop>
      <View style={styles.card}>
        <View style={styles.favoriteRow}>
          <FavoriteButton
            favorito={story.favorito}
            // US-96: en anónimo, guardar como favorito requiere cuenta → pide alta.
            onToggle={async (favorito) => {
              if (anonimo) {
                pedirCuenta();
                return;
              }
              await api.stories.setFavorite(story.id, favorito);
            }}
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
          onReachedEnd={alLlegarFinal}
        />
        {/* US-96: en anónimo la narración usa endpoints con id/sesión reales que no
            existen; se muestra un botón "Escuchar" que invita a crear cuenta. */}
        {anonimo ? (
          <View style={styles.narrationAnon}>
            <View style={styles.narrationAnonBtn}>
              <BubblyButton
                label={t('narration.idle')}
                icon="play"
                variant="secondary"
                onPress={pedirCuenta}
              />
            </View>
          </View>
        ) : (
          <NarrationControls story={story} onFinished={marcarLeido} />
        )}
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
            onPress={anonimo ? pedirCuenta : marcarLeido}
          />
        )}
        {/* US-78: continuar la historia con un capítulo nuevo generado por IA. */}
        <BubblyButton
          label={t('reader.continueStory')}
          icon="arrow-right"
          variant="secondary"
          onPress={anonimo ? pedirCuenta : continuar}
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
    // El botón "Escuchar" del modo anónimo ocupa el ancho como los controles reales.
    narrationAnon: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    narrationAnonBtn: {
      flex: 1,
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
