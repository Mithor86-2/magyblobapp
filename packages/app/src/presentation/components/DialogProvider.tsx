import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BubblyButton } from './BubblyButton';
import { useThemedStyles } from '../theme/ThemeProvider';
import { type ColorTokens, makeSoftShadow, radius, spacing, typography } from '../theme/tokens';

/**
 * Avisos y confirmaciones con el estilo de la app (US-23), en lugar de las
 * `Alert.alert` nativas del sistema. Un único `<Modal>` montado en la raíz
 * (`DialogProvider`, sobre la navegación) se controla de forma imperativa con
 * `useDialog()`: `alert()` para avisos y `confirm()` para acciones con
 * confirmar/cancelar (con variante destructiva).
 */

interface AlertOptions {
  title: string;
  message: string;
  /** Texto del único botón (por defecto "Entendido"). */
  buttonLabel?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  /** Texto del botón que confirma (por defecto "Aceptar"). */
  confirmLabel?: string;
  /** Texto del botón que cancela (por defecto "Cancelar"). */
  cancelLabel?: string;
  /** Resalta el botón de confirmar como acción destructiva (rojo). */
  destructive?: boolean;
  onConfirm: () => void;
}

interface DialogApi {
  alert: (options: AlertOptions) => void;
  confirm: (options: ConfirmOptions) => void;
}

interface DialogState {
  kind: 'alert' | 'confirm';
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive: boolean;
  onConfirm?: () => void;
}

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  const [state, setState] = useState<DialogState | null>(null);

  const close = useCallback(() => setState(null), []);

  const api = useMemo<DialogApi>(
    () => ({
      alert: ({ title, message, buttonLabel }) =>
        setState({
          kind: 'alert',
          title,
          message,
          confirmLabel: buttonLabel ?? 'Entendido',
          destructive: false,
        }),
      confirm: ({ title, message, confirmLabel, cancelLabel, destructive, onConfirm }) =>
        setState({
          kind: 'confirm',
          title,
          message,
          confirmLabel: confirmLabel ?? 'Aceptar',
          cancelLabel: cancelLabel ?? 'Cancelar',
          destructive: destructive ?? false,
          onConfirm,
        }),
    }),
    [],
  );

  const onConfirmPress = useCallback(() => {
    const action = state?.onConfirm;
    close();
    action?.();
  }, [state, close]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={state !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
        accessibilityViewIsModal
      >
        <Pressable style={styles.backdrop} onPress={state?.kind === 'alert' ? close : undefined}>
          {/* El View interno "traga" el toque para no cerrar al pulsar la tarjeta. */}
          <Pressable style={styles.card} onPress={() => {}}>
            {state ? (
              <>
                <Text style={styles.title}>{state.title}</Text>
                <Text style={styles.message}>{state.message}</Text>
                <View style={styles.actions}>
                  {state.kind === 'confirm' ? (
                    <BubblyButton
                      label={state.cancelLabel ?? 'Cancelar'}
                      onPress={close}
                      variant="secondary"
                    />
                  ) : null}
                  <BubblyButton
                    label={state.confirmLabel}
                    onPress={state.kind === 'confirm' ? onConfirmPress : close}
                    variant={state.destructive ? 'danger' : 'primary'}
                  />
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

/** Acceso a los avisos/confirmaciones de la app. Debe usarse bajo `DialogProvider`. */
export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog debe usarse dentro de <DialogProvider>.');
  return ctx;
}

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(34, 26, 22, 0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...makeSoftShadow(colors),
    },
    title: {
      ...typography.headlineMd,
      color: colors.primary,
    },
    message: {
      ...typography.bodyMd,
      color: colors.onSurface,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
  });
