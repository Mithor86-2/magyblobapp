/**
 * Quita emojis y pictogramas del texto antes de narrarlo con la voz nativa
 * (`expo-speech`), que si no los lee como "emoji ...". Espejo del sanitizador del
 * backend (US-22); el wire boundary justifica la pequeña duplicación.
 */
export function sanitizeForSpeech(texto: string): string {
  return texto
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/\u200D|\uFE0E|\uFE0F/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ([,.;:!?])/g, '$1')
    .trim();
}
