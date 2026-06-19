/**
 * Limpia un texto para narrarlo en voz alta: quita emojis y símbolos
 * pictográficos (que los motores TTS leen de forma rara o como "emoji ...") y
 * normaliza los espacios que quedan. No toca puntuación normal ni acentos.
 */
export function sanitizeForSpeech(texto: string): string {
  return texto
    .replace(/\p{Extended_Pictographic}/gu, '') // emojis y pictogramas
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '') // indicadores regionales (banderas)
    .replace(/\u200D|\uFE0E|\uFE0F/g, '') // ZWJ y selectores de variación
    .replace(/[ \t]{2,}/g, ' ') // colapsa espacios que dejan los emojis quitados
    .replace(/ ([,.;:!?])/g, '$1') // quita el espacio huérfano antes de puntuación
    .trim();
}
