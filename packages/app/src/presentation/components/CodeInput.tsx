import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, radius, spacing, typography } from '../theme/tokens';

interface CodeInputProps {
  value: string;
  onChangeText: (code: string) => void;
  /** Número de dígitos (por defecto 6). */
  length?: number;
  /** Enfoca automáticamente al montar. */
  autoFocus?: boolean;
  /** Identificador estable para tests/E2E (va en el input real subyacente). */
  testID?: string;
  /** Etiqueta accesible del campo. */
  accessibilityLabel?: string;
}

/**
 * Entrada de código OTP en **casillas independientes** (una por dígito, US-93). Sobre
 * un único `TextInput` real (transparente, superpuesto) que captura el texto y maneja
 * borrado y pegado sin malabares de foco, se pintan `length` casillas que muestran cada
 * dígito y resaltan la posición activa. Solo admite dígitos y acota a `length`.
 */
export function CodeInput({
  value,
  onChangeText,
  length = 6,
  autoFocus,
  testID,
  accessibilityLabel,
}: CodeInputProps) {
  const styles = useThemedStyles(makeStyles);
  const inputRef = useRef<TextInput>(null);
  const enfocar = () => inputRef.current?.focus();

  return (
    <Pressable onPress={enfocar} style={styles.wrap} accessibilityLabel={accessibilityLabel}>
      <View style={styles.row}>
        {Array.from({ length }).map((_, i) => {
          const activo = i === Math.min(value.length, length - 1) && value.length < length;
          const lleno = i < value.length;
          const enUltimaLlena = value.length === length && i === length - 1;
          return (
            <View
              key={i}
              style={[
                styles.box,
                lleno && styles.boxFilled,
                (activo || enUltimaLlena) && styles.boxActive,
              ]}
            >
              <Text style={styles.digit}>{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        testID={testID}
        style={styles.hiddenInput}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        autoCorrect={false}
        accessibilityLabel={accessibilityLabel}
      />
    </Pressable>
  );
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    wrap: {
      position: 'relative',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.xs,
      // Los toques atraviesan las casillas hasta el input real superpuesto.
      pointerEvents: 'none',
    },
    box: {
      flex: 1,
      aspectRatio: 0.85,
      maxWidth: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.tertiaryContainer,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceContainer,
    },
    boxFilled: {
      borderColor: colors.secondary,
    },
    boxActive: {
      borderColor: colors.primary,
    },
    digit: {
      ...typography.displayLg,
      color: colors.onSurface,
    },
    // Input real superpuesto y transparente: recibe teclado y captura el valor; las
    // casillas de arriba son la representación visual.
    hiddenInput: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      color: 'transparent',
      opacity: 0.01,
    },
  });
