import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from './Screen';
import { SelectableChip } from './SelectableChip';
import { useDialog } from './DialogProvider';
import { colors, spacing, typography } from '../theme/tokens';

/**
 * Puerta parental reutilizable: una suma sencilla **aleatoria** (no memorizable
 * por un niño) que protege el acceso a la zona de personas adultas (alta de
 * cuenta, gestión, cierre de sesión). Se regenera en cada apertura y tras cada
 * fallo. Disuasorio ligero; la verificación robusta de edad queda fuera de
 * alcance (ver Docs/cumplimiento-menores.md, C-1/C-6).
 *
 * Mientras no se resuelve, muestra el reto; al acertar, renderiza `children`.
 */
export function ParentalGate({ children, intro }: { children: ReactNode; intro?: string }) {
  const { t } = useTranslation();
  const [passed, setPassed] = useState(false);
  const [reto, setReto] = useState<RetoParental>(crearReto);
  const dialog = useDialog();

  if (passed) return <>{children}</>;

  return (
    <Screen>
      <Text style={styles.title}>{t('parentalGate.title')}</Text>
      <Text style={styles.body}>{intro ?? t('parentalGate.bodyDefault')}</Text>
      <Text testID="parental-pregunta" style={styles.question}>
        {t('parentalGate.question', { a: reto.a, b: reto.b })}
      </Text>
      <View style={styles.options}>
        {reto.opciones.map((option) => (
          <SelectableChip
            key={option}
            label={String(option)}
            selected={false}
            onPress={() => {
              if (option === reto.respuesta) {
                setPassed(true);
              } else {
                dialog.alert({
                  title: t('parentalGate.wrongTitle'),
                  message: t('parentalGate.wrongMessage'),
                });
                setReto(crearReto());
              }
            }}
          />
        ))}
      </View>
    </Screen>
  );
}

interface RetoParental {
  a: number;
  b: number;
  respuesta: number;
  opciones: number[];
}

const aleatorio = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function crearReto(): RetoParental {
  const a = aleatorio(3, 9);
  const b = aleatorio(2, 6);
  const respuesta = a + b;
  // Respuesta + dos distractores contiguos, barajados.
  const opciones = [respuesta, respuesta - 1, respuesta + 1];
  for (let i = opciones.length - 1; i > 0; i--) {
    const j = aleatorio(0, i);
    [opciones[i], opciones[j]] = [opciones[j]!, opciones[i]!];
  }
  return { a, b, respuesta, opciones };
}

const styles = StyleSheet.create({
  title: {
    ...typography.displayLg,
    color: colors.primary,
  },
  body: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  question: {
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
});
