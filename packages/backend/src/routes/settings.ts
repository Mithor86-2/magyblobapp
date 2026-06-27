import type { FastifyInstance } from 'fastify';
import type { Config } from '../config.js';

/**
 * Ajustes de la narración (TTS) expuestos por el backend (US-55). Solo lectura y
 * **sin secretos**: devuelve qué voz hay configurada por idioma y el modelo, y si
 * hay clave de ElevenLabs (`hasApiKey`) para que la zona de adultos sepa si la voz
 * premium está disponible o se narrará con la voz nativa. No llama a ElevenLabs
 * (sin red, sin coste) ni revela la `xi-api-key`.
 */
export function settingsRoutes(app: FastifyInstance, config: Config): void {
  app.get('/settings/tts/voices', async () => ({
    model: config.tts.model,
    hasApiKey: config.tts.apiKey !== undefined && config.tts.apiKey.trim() !== '',
    voices: {
      es: config.tts.voiceIdByLang.es,
      en: config.tts.voiceIdByLang.en,
    },
  }));
}
