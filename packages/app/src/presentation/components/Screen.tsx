import type { ReactNode } from 'react';
import {
  Image,
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
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';

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
 * La imagen se muestra **completa** (`resizeMode="contain"`) dentro de una **banda de alto
 * proporcional** al alto de pantalla (~22 %, acotado a `[HEADER_MIN, HEADER_MAX]`, feature 65),
 * centrada, con el fondo del theme (`colors.surface`) rellenando el espacio sobrante: queda
 * entera y bien encuadrada sin la banda gigante que dejaba el `aspectRatio` cuadrado del origen.
 */

/** Banda de cabecera (US-58, ajuste feature 65): proporción del alto de pantalla y cota. */
const HEADER_RATIO = 0.22;
const HEADER_MIN = 170;
const HEADER_MAX = 200;

export function Screen({
  children,
  footer,
  headerImageName,
  headerAction,
  title,
}: {
  children: ReactNode;
  footer?: ReactNode;
  headerImageName?: HeaderImageName;
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
  const { height } = useWindowDimensions();
  const styles = useThemedStyles(makeStyles);
  // Alto proporcional acotado: ni minúscula en pantallas bajas ni gigante en altas.
  const headerHeight = Math.max(HEADER_MIN, Math.min(HEADER_MAX, height * HEADER_RATIO));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* A6/US-80: barra fija con el nombre de sección (izquierda) y las acciones
            (zona de adultos, derecha), dentro del área segura y por encima del scroll. */}
        {title || headerAction ? (
          <View style={styles.headerBar}>
            {title ? (
              <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <View />
            )}
            {headerAction ?? <View />}
          </View>
        ) : null}
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {headerImageName ? (
            <Appear>
              <Image
                source={headerImages[headerImageName]}
                style={[styles.header, { height: headerHeight }]}
                resizeMode="contain"
                accessibilityRole="image"
              />
            </Appear>
          ) : null}
          <View style={styles.body}>{children}</View>
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
      // El alto (banda proporcional acotada) se inyecta en línea (feature 65). Con
      // `resizeMode="contain"` la imagen se ve completa y centrada dentro de la banda; el
      // fondo del theme rellena de forma equilibrada el espacio sobrante a los lados.
      backgroundColor: colors.surface,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    body: {
      flexGrow: 1,
      padding: spacing.containerPadding,
      gap: spacing.md,
    },
    footer: {
      paddingHorizontal: spacing.containerPadding,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.containerPadding,
      paddingTop: spacing.sm,
    },
    headerTitle: {
      ...typography.headlineMd,
      color: colors.onSurface,
      flexShrink: 1,
    },
  });
