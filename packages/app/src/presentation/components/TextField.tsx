import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, tapTarget, typography } from '../theme/tokens';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  /** Oculta el texto introducido (contraseñas). Opcional y aditivo. */
  secureTextEntry?: boolean;
  /** Identificador estable para selección en E2E nativo (Maestro). Opcional y aditivo. */
  testID?: string;
}

/**
 * Campo de formulario (zona de adultos): radio conservador de 16px y borde
 * terciario, según el design system. Etiqueta siempre visible.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  testID,
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
  },
  input: {
    ...typography.bodyMd,
    color: colors.onSurface,
    minHeight: tapTarget,
    borderWidth: 2,
    borderColor: colors.tertiaryContainer,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceContainer,
  },
});
