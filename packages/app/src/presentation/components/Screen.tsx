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
              resizeMode="cover"
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
    height: 170,
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
