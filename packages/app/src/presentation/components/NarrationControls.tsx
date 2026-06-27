import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BubblyButton } from './BubblyButton';
import { useNarration } from '../hooks/useNarration';
import { spacing } from '../theme/tokens';
import type { Story } from '../../domain/types';

/**
 * Controles de narración de un cuento (US-22): un botón principal que alterna
 * escuchar/pausar/reanudar y un botón de parar cuando suena. La lógica (audio de
 * ElevenLabs + fallback a voz nativa + limpieza) vive en `useNarration`.
 */
export function NarrationControls({ story }: { story: Story }) {
  const { t } = useTranslation();
  const { estado, escuchar, pausar, parar } = useNarration(story);
  const sonando = estado === 'playing' || estado === 'paused';

  return (
    <View style={styles.row}>
      <View style={styles.principal}>
        <BubblyButton
          label={t(`narration.${estado}`)}
          icon={estado === 'playing' ? 'pause' : 'play'}
          variant="secondary"
          loading={estado === 'loading'}
          onPress={estado === 'playing' ? pausar : escuchar}
        />
      </View>
      {sonando ? (
        <BubblyButton
          icon="stop"
          accessibilityLabel={t('narration.stop')}
          variant="secondary"
          onPress={parar}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  principal: {
    flex: 1,
  },
});
