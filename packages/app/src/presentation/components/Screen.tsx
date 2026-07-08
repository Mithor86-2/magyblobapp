import type { ReactNode } from 'react';
import {
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appear } from './Appear';
import { BouncingHeaderImage } from './BouncingHeaderImage';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, spacing, typography } from '../theme/tokens';

/**
 * Nombre lógico de cada cabecera ilustrada (US-58). El mapa a la imagen usa
 * `require` **estáticos** porque Metro no resuelve `require` dinámicos: solo se
 * empaqueta lo referenciado literalmente en `headerImages`.
 */
export type HeaderImageName = 'welcome' | 'home' | 'dashboard' | 'cuentos' | 'actividades';

const headerImages: Record<HeaderImageName, ImageSourcePropType> = {
  welcome: require('../../../assets/images/headers/welcome.png'),
  home: require('../../../assets/images/headers/home.png'),
  dashboard: require('../../../assets/images/headers/dashboard.png'),
  cuentos: require('../../../assets/images/headers/cuentos.png'),
  actividades: require('../../../assets/images/headers/actividades.png'),
};

/**
 * Lienzo base de cada pantalla: fondo crema, márgenes seguros de 24px y scroll.
 * `footer` queda fijo abajo (acción principal siempre alcanzable con el pulgar).
 *
 * `KeyboardAvoidingView` (US-53): al abrirse el teclado, el contenido se reacomoda
 * para que ningún campo de los formularios (Consent/Login/CreateProfile) quede tapado
 * (`padding` en iOS, `height` en Android). El `ScrollView` permite alcanzar el resto.
 *
 * `headerImageName` (US-58): si se pasa, pinta la imagen de cabecera correspondiente
 * arriba del contenido, dentro del área segura y por encima del `ScrollView` (se
 * desplaza con el contenido), conservando el footer fijo y el `KeyboardAvoidingView`.
 * La imagen ocupa el **100 % del ancho** y su alto se calcula como `ancho / HEADER_ASPECT_RATIO`
 * (alto numérico explícito): se ve **entera, sin recorte ni bandas laterales**, como un banner
 * apaisado. Se usa un alto en píxeles y no `aspectRatio` porque en react-native(-web) el
 * `aspectRatio` sobre `Image` no fija el alto (la imagen se estira a su alto natural).
 */

/**
 * Proporción (ancho/alto) del banner de cabecera. Las cinco imágenes comparten origen
 * 2752×1536 (≈ 1.79, apaisado 16:9).
 */
const HEADER_ASPECT_RATIO = 2752 / 1536;

export function Screen({
  children,
  footer,
  headerImageName,
  headerAction,
  title,
  tightTop = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  headerImageName?: HeaderImageName;
  /**
   * Reduce el margen superior del contenido (útil cuando la pantalla ya tiene cabecera
   * de stack y no queremos un hueco grande, p. ej. el lector de cuento).
   */
  tightTop?: boolean;
  /**
   * Acción fija arriba a la derecha, por encima del contenido y del scroll (A6): la
   * usan las pestañas para el botón de la zona de adultos. Fija = no se desplaza con
   * el scroll (posicionada sobre el área segura).
   */
  headerAction?: ReactNode;
  /**
   * Nombre de la sección (US-80): si se pasa, se muestra fijo arriba a la izquierda de
   * la barra de cabecera, alineado con `headerAction`. Ayuda a saber en qué pantalla se
   * está sin depender solo de la pestaña activa.
   */
  title?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  // Alto explícito = ancho de pantalla / proporción: banner a ancho completo, entero.
  const headerHeight = width / HEADER_ASPECT_RATIO;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* A6/US-80: barra fija dentro del área segura y por encima del scroll. El título va
            **centrado** (US-100) con un espaciador a cada lado del mismo ancho que la acción,
            para que quede centrado en toda la barra aunque la acción (zona de adultos) esté a
            la derecha. */}
        {title || headerAction ? (
          <View style={styles.headerBar}>
            <View style={styles.headerSide} />
            {title ? (
              <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <View style={styles.headerTitle} />
            )}
            <View style={styles.headerSideRight}>{headerAction}</View>
          </View>
        ) : null}
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {headerImageName ? (
            <Appear>
              {/* US-86 (ajuste #4): la cabecera rebota suavemente en loop (translateY). */}
              <BouncingHeaderImage
                source={headerImages[headerImageName]}
                style={[styles.header, { height: headerHeight }]}
              />
            </Appear>
          ) : null}
          <View style={[styles.body, tightTop && styles.bodyTight]}>{children}</View>
        </ScrollView>
        {footer ? (
          <View style={styles.footer}>
            <Appear>{footer}</Appear>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
    },
    header: {
      width: '100%',
      // Banner a ancho completo y full-bleed: el alto se inyecta en línea (ancho / proporción),
      // así la imagen se ve entera, sin recorte ni bandas laterales.
    },
    body: {
      flexGrow: 1,
      padding: spacing.containerPadding,
      gap: spacing.md,
    },
    // Margen superior reducido (tightTop): pega el contenido a la cabecera del stack.
    bodyTight: {
      paddingTop: spacing.xs,
    },
    footer: {
      paddingHorizontal: spacing.containerPadding,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.containerPadding,
      paddingTop: spacing.sm,
    },
    headerTitle: {
      ...typography.headlineMd,
      color: colors.primary,
      flex: 1,
      textAlign: 'center',
    },
    // Espaciadores del mismo ancho que la acción (zona de adultos, ~48px) para que el título
    // quede centrado en toda la barra; el derecho aloja la acción alineada a la derecha.
    headerSide: {
      width: 48,
    },
    headerSideRight: {
      width: 48,
      alignItems: 'flex-end',
    },
  });
