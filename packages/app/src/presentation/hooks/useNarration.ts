import { useCallback, useEffect, useRef, useState } from 'react';
import { fetch } from 'expo/fetch';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { api } from '../../composition';
import { sanitizeForSpeech } from './sanitizeForSpeech';
import type { Story } from '../../domain/types';

export type EstadoNarracion = 'idle' | 'loading' | 'playing' | 'paused';

/** Timeout de la descarga del audio: si ElevenLabs no responde, degradamos a voz nativa sin colgarnos. */
const NARRATION_TIMEOUT_MS = 15_000;

/**
 * Narración de un cuento (US-22). Pide el audio al backend (ElevenLabs, vía
 * proxy), lo cachea en disco y lo reproduce con `expo-audio`. Si la petición
 * falla (red/timeout/clave ausente o backend caído) **degrada a la voz nativa**
 * del dispositivo (`expo-speech`) sin error visible para el niño. Limpia el
 * audio y la voz al desmontar.
 */
export function useNarration(story: Story) {
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [estado, setEstado] = useState<EstadoNarracion>('idle');
  // Si caímos a la voz nativa, el control de pausa/parada va por expo-speech.
  const vozNativa = useRef(false);

  const idioma = story.idioma === 'en' ? 'en-US' : 'es-ES';

  const narrarConVozNativa = useCallback(() => {
    vozNativa.current = true;
    Speech.stop();
    Speech.speak(sanitizeForSpeech(story.cuerpo), {
      language: idioma,
      onDone: () => setEstado('idle'),
      onStopped: () => setEstado('idle'),
      onError: () => setEstado('idle'),
    });
    setEstado('playing');
  }, [story.cuerpo, idioma]);

  const escuchar = useCallback(async () => {
    // Reanudar una pausa del audio de ElevenLabs.
    if (estado === 'paused' && !vozNativa.current) {
      player.play();
      setEstado('playing');
      return;
    }

    setEstado('loading');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NARRATION_TIMEOUT_MS);
    try {
      const res = await fetch(api.stories.narrationUrl(story.id), { signal: controller.signal });
      if (!res.ok) throw new Error(`Narración no disponible (${res.status}).`);
      const bytes = await res.bytes();

      const file = new File(Paths.cache, `narration-${story.id}.mp3`);
      if (file.exists) file.delete();
      file.write(bytes);

      await setAudioModeAsync({ playsInSilentMode: true });
      vozNativa.current = false;
      player.replace(file.uri);
      player.play();
      setEstado('playing');
    } catch {
      // Red/timeout/clave ausente/backend caído → voz nativa del dispositivo, sin error visible.
      narrarConVozNativa();
    } finally {
      clearTimeout(timer);
    }
  }, [estado, player, story.id, narrarConVozNativa]);

  const pausar = useCallback(() => {
    if (vozNativa.current) {
      // expo-speech no pausa de forma fiable en todas las plataformas → parar.
      Speech.stop();
      setEstado('idle');
    } else {
      player.pause();
      setEstado('paused');
    }
  }, [player]);

  const parar = useCallback(() => {
    if (vozNativa.current) {
      Speech.stop();
    } else {
      player.pause();
      player.seekTo(0);
    }
    setEstado('idle');
  }, [player]);

  // El audio (ElevenLabs) terminó por sí solo → volver a idle.
  useEffect(() => {
    if (!vozNativa.current && status.didJustFinish) setEstado('idle');
  }, [status.didJustFinish]);

  // Limpieza al desmontar: corta audio y voz nativa.
  useEffect(() => {
    return () => {
      Speech.stop();
      try {
        player.pause();
      } catch {
        // el player ya pudo liberarse; ignorar.
      }
    };
  }, [player]);

  return { estado, escuchar, pausar, parar };
}
