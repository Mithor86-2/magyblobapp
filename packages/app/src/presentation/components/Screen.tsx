import type { ReactNode } from 'react';
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme/tokens';

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
 * La imagen se muestra **completa** (`resizeMode="contain"`, feature 64): el contenedor
 * toma la proporción del origen (~1000×1026, casi cuadrada) para que se vea entera y bien
 * encuadrada, sin recorte; si sobra espacio, el fondo es el del theme (`colors.surface`).
 */
export function Screen({
  children,
  footer,
  headerImageName,
}: {
  children: ReactNode;
  footer?: ReactNode;
  headerImageName?: HeaderImageName;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {headerImageName ? (
            <Image
              source={headerImages[headerImageName]}
              style={styles.header}
              resizeMode="contain"
              accessibilityRole="image"
            />
          ) : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    // Proporción del origen (~1000×1026, casi cuadrada): con `resizeMode="contain"`
    // muestra la imagen completa sin recorte y bien encuadrada (feature 64). El fondo
    // del theme cubre cualquier franja si el ancho real no casa exactamente.
    aspectRatio: 1000 / 1026,
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
});
