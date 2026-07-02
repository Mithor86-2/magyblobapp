import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import { CATEGORIAS, type Categoria, type Ensenanza } from '../../domain/vocabulary.js';
import {
  buildActivitiesPrompt,
  buildStoryPrompt,
  joinPromptParts,
  protagonista,
  terminoCuidador,
} from './prompts.js';

/**
 * Proveedor de IA determinista que NO necesita Ollama ni red. Cumple tres papeles:
 *
 * 1. Modo por defecto (`AI_PROVIDER=mock`): un evaluador sin GPU puede ejecutar
 *    todo el flujo (crear perfil → ver cuento) sin descargar modelos.
 * 2. Red de seguridad: es el fallback automático cuando el proveedor activo
 *    (Ollama) no responde — ver `FallbackProvider`.
 * 3. Base de los tests rápidos del dominio/aplicación.
 *
 * El contenido sale en el idioma del perfil y es estable para una misma entrada.
 */
export class MockProvider implements AIProvider {
  async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
    const idioma = input.perfil.idioma.value;
    // US-76: protagonista real o genérico ("nuestro pequeño amigo") según `usarNombre`.
    const proto = protagonista(input.perfil.nombre, input.usarNombre, idioma);
    // US-47: el tema puede ser una lista; la mock usa el primero como representante
    // para mantener una salida determinista y legible. El caso de uso garantiza ≥1.
    const tema = input.temas[0] ?? 'aventuras';
    // US-54: el título varía entre generaciones en lugar de usar siempre la misma
    // fórmula. Se elige de un repertorio de plantillas con un índice derivado del
    // contenido (protagonista + temas + idioma). US-78: si es continuación, se marca.
    const esContinuacion = (input.contexto ?? '').trim().length > 0;
    const titulo = tituloVariado(proto, input.temas, idioma, esContinuacion);
    // US-61: prompt representativo (el que usarían los proveedores reales por defecto).
    const prompt = joinPromptParts(buildStoryPrompt(input));
    // US-69: si se eligió una enseñanza, la mock la refleja de forma determinista en
    // una frase de moraleja al final (cadena vacía si no hay enseñanza).
    const moraleja = moralejaMock(input.ensenanza, idioma);
    // A1/US-74 + US-75: el cuerpo mock sale dividido en ≥4 páginas (párrafos separados
    // por `\n\n`), y cada página tiene al menos 3 frases. US-78: cuerpo de continuación
    // si viene contexto. El paginado del app respeta esos cortes.
    const cuerpo = esContinuacion
      ? cuerpoContinuacion(proto, tema, idioma, moraleja)
      : cuerpoNuevo(proto, tema, idioma, moraleja);
    return { titulo, cuerpo, proveedor: 'mock', prompt };
  }

  /**
   * El mock no genera imágenes (US-59): devuelve `null` para que la app use el
   * respaldo local empaquetado. Así el modo por defecto (sin red ni clave) sigue
   * funcionando sin GPU ni terceros.
   */
  async generateImage(): Promise<string | null> {
    return null;
  }

  async recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]> {
    const idioma = input.perfil.idioma.value;
    // US-67/US-77: el trato se dirige al adulto por su parentesco + nombre ("mamá Ana").
    const cuidador = terminoCuidador(input.parentesco, idioma, input.nombreCuidador);
    // US-61: prompt representativo del lote (el que usarían los proveedores reales).
    const prompt = joinPromptParts(buildActivitiesPrompt(input));
    return Array.from({ length: input.cantidad }, (_unused, i): GeneratedActivity => {
      const categoria: Categoria = input.categoria ?? CATEGORIAS[i % CATEGORIAS.length]!;
      return {
        categoria,
        ...PLANTILLAS_ACTIVIDAD[idioma](categoria, i + 1, cuidador),
        duracionMin: 10 + (i % 3) * 5,
        nivel: (i % 3) + 1,
        proveedor: 'mock',
        prompt,
      };
    });
  }
}

type DatosActividad = { titulo: string; descripcion: string; instrucciones: string };

/**
 * Pasos del paso a paso de la mock (US-67): se exige al menos 6 pasos detallados.
 * Hay 8 plantillas por idioma; cada actividad usa un número de pasos en [6, 8]
 * derivado de `n` (determinista) para que el conjunto mock cumpla el mínimo sin red.
 */
const PASOS_ACTIVIDAD: Record<CodigoIdioma, ((categoria: Categoria, c: string) => string)[]> = {
  es: [
    (categoria, c) => `${cap(c)} reúne los materiales sencillos de ${categoria} que hay en casa.`,
    (_categoria, c) =>
      `${cap(c)} explica la actividad al niño con palabras sencillas y un ejemplo.`,
    (_categoria, c) => `El niño elige por dónde empezar mientras ${c} le acompaña.`,
    (_categoria, c) => `${cap(c)} muestra el primer paso y el niño lo repite a su ritmo.`,
    (_categoria, c) => `El niño prueba por sí mismo y ${c} le anima cuando lo intenta.`,
    (_categoria, c) => `${cap(c)} hace preguntas sencillas para que el niño cuente lo que hace.`,
    (_categoria, c) => `El niño termina la actividad y ${c} le ayuda a recoger.`,
    (_categoria, c) =>
      `${cap(c)} y el niño celebran juntos el resultado y comentan qué han aprendido.`,
  ],
  en: [
    (categoria, c) => `${cap(c)} gathers the simple ${categoria} materials found at home.`,
    (_categoria, c) =>
      `${cap(c)} explains the activity to the child in simple words with an example.`,
    (_categoria, c) => `The child chooses where to start while ${c} stays close.`,
    (_categoria, c) => `${cap(c)} shows the first step and the child repeats it at their own pace.`,
    (_categoria, c) => `The child tries on their own and ${c} cheers them on as they attempt it.`,
    (_categoria, c) => `${cap(c)} asks simple questions so the child can tell what they are doing.`,
    (_categoria, c) => `The child finishes the activity and ${c} helps tidy up.`,
    (_categoria, c) =>
      `${cap(c)} and the child celebrate the result together and talk about what they learned.`,
  ],
};

/** Une los pasos en una cadena numerada "1. ... 2. ...". */
function pasosNumerados(pasos: string[]): string {
  return pasos.map((paso, i) => `${i + 1}. ${paso}`).join(' ');
}

/** Pone en mayúscula la primera letra (para el trato del cuidador al inicio de frase). */
function cap(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const PLANTILLAS_ACTIVIDAD: Record<
  CodigoIdioma,
  (categoria: Categoria, n: number, cuidador: string) => DatosActividad
> = {
  es: (categoria, n, cuidador) => ({
    titulo: `Actividad de ${categoria} nº ${n}`,
    descripcion: `Una propuesta sencilla de ${categoria} para jugar y aprender en casa.`,
    instrucciones: instruccionesMock('es', categoria, n, cuidador),
  }),
  en: (categoria, n, cuidador) => ({
    titulo: `${categoria} activity #${n}`,
    descripcion: `A simple ${categoria} idea to play and learn at home.`,
    instrucciones: instruccionesMock('en', categoria, n, cuidador),
  }),
};

/** Paso a paso mock con un número de pasos en [6, 8] derivado de `n` (US-67). */
function instruccionesMock(
  idioma: CodigoIdioma,
  categoria: Categoria,
  n: number,
  cuidador: string,
): string {
  const plantillas = PASOS_ACTIVIDAD[idioma];
  const cantidad = 6 + ((n - 1) % 3); // 6, 7 u 8 pasos (siempre ≥6)
  const pasos = plantillas.slice(0, cantidad).map((paso) => paso(categoria, cuidador));
  return pasosNumerados(pasos);
}

/**
 * Repertorio de plantillas de título por idioma para variar el título del cuento
 * (US-54). La selección es determinista: un índice derivado del contenido
 * (nombre + temas + idioma) elige una plantilla, de modo que la misma entrada da
 * el mismo título pero temas/perfiles distintos dan títulos distintos.
 */
const PLANTILLAS_TITULO: Record<CodigoIdioma, ((nombre: string, tema: string) => string)[]> = {
  es: [
    (nombre, tema) => `${nombre} y la aventura de ${tema}`,
    (nombre, tema) => `El gran viaje de ${nombre} por ${tema}`,
    (nombre, tema) => `${nombre} descubre ${tema}`,
    (nombre, tema) => `Una sorpresa de ${tema} para ${nombre}`,
    (nombre, tema) => `${nombre} y el secreto de ${tema}`,
  ],
  en: [
    (nombre, tema) => `${nombre} and the ${tema} adventure`,
    (nombre, tema) => `${nombre}'s great journey through ${tema}`,
    (nombre, tema) => `${nombre} discovers ${tema}`,
    (nombre, tema) => `A ${tema} surprise for ${nombre}`,
    (nombre, tema) => `${nombre} and the secret of ${tema}`,
  ],
};

/**
 * Frase de moraleja de la mock por enseñanza (US-69), determinista y por idioma. Se
 * añade al final del cuerpo cuando el adulto eligió una enseñanza; '' si no eligió.
 */
const MORALEJA_MOCK: Record<CodigoIdioma, Record<Ensenanza, string>> = {
  es: {
    amistad: ' Y aprendió que la amistad y compartir hacen todo más bonito.',
    emociones: ' Y aprendió a reconocer y calmar lo que sentía.',
    valentia: ' Y aprendió que ser valiente es intentarlo aunque dé un poquito de miedo.',
    honestidad: ' Y aprendió que decir la verdad y respetar a los demás está muy bien.',
  },
  en: {
    amistad: ' And they learned that friendship and sharing make everything nicer.',
    emociones: ' And they learned to recognize and calm what they felt.',
    valentia: ' And they learned that being brave means trying even when it feels a little scary.',
    honestidad: ' And they learned that telling the truth and respecting others feels great.',
  },
};

/** Devuelve la frase de moraleja mock para la enseñanza elegida, o '' si no hay ninguna. */
function moralejaMock(ensenanza: Ensenanza | undefined, idioma: CodigoIdioma): string {
  return ensenanza ? MORALEJA_MOCK[idioma][ensenanza] : '';
}

/** Hash estable y simple (no criptográfico) de una cadena a entero no negativo. */
function hashCadena(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (h * 31 + texto.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function tituloVariado(
  nombre: string,
  temas: readonly string[],
  idioma: CodigoIdioma,
  esContinuacion = false,
): string {
  const tema = temas[0] ?? 'aventuras';
  const plantillas = PLANTILLAS_TITULO[idioma];
  const idx = hashCadena(`${nombre}|${temas.join(',')}|${idioma}`) % plantillas.length;
  const base = plantillas[idx]!(nombre, tema);
  // US-78: el título de una continuación se distingue del original.
  if (!esContinuacion) return base;
  return idioma === 'es' ? `${base} — la aventura continúa` : `${base} — the adventure continues`;
}

/**
 * Cuerpo mock de un cuento nuevo (US-75): ≥4 páginas separadas por `\n\n`, cada una
 * con al menos 3 frases. `proto` es el protagonista (real o genérico, US-76) y
 * `moraleja` la frase final de enseñanza (US-69), o '' si no hay.
 */
function cuerpoNuevo(proto: string, tema: string, idioma: CodigoIdioma, moraleja: string): string {
  if (idioma === 'es') {
    return (
      `Había una vez ${proto}, que soñaba con ${tema}. Cada mañana miraba por la ventana con una gran sonrisa. Su corazón latía deprisa, ¡plin-plin!, de pura emoción.\n\n` +
      `Un día ${proto} partió en un viaje lleno de color y risas. El camino subía y bajaba entre montañas blanditas. A cada paso descubría algo nuevo y sorprendente.\n\n` +
      `Por el camino hizo nuevos amigos que le ayudaron a ser valiente. Juntos cantaron canciones y se contaron secretos. Cuando algo daba un poquito de miedo, se daban la mano.\n\n` +
      `Así descubrieron que lo más bonito de ${tema} es compartirlo. Rieron hasta que les dolió la barriga, ¡ja-ja-ja! Y entendieron que la mejor magia es estar juntos.\n\n` +
      `Al final ${proto} volvió a casa feliz y tranquilo. Se acurrucó en su camita calentita. Y cerró los ojos, listo para soñar otra aventura.${moraleja}`
    );
  }
  return (
    `Once upon a time there was ${proto}, who dreamed about ${tema}. Every morning they looked out the window with a big smile. Their heart beat fast, plink-plink, with pure excitement.\n\n` +
    `One day ${proto} set off on a journey full of color and laughter. The path went up and down through soft, fluffy hills. With every step they discovered something new and surprising.\n\n` +
    `Along the way they made new friends who helped them be brave. Together they sang songs and shared little secrets. Whenever something felt a bit scary, they held hands.\n\n` +
    `So they discovered that the best part of ${tema} is sharing it. They laughed until their tummies hurt, ha-ha-ha! And they learned that the best magic is being together.\n\n` +
    `In the end ${proto} came back home happy and calm. They snuggled into their cozy little bed. And they closed their eyes, ready to dream up another adventure.${moraleja}`
  );
}

/**
 * Cuerpo mock de una continuación (US-78): retoma la historia con los mismos
 * personajes. ≥4 páginas de ≥3 frases (US-75), separadas por `\n\n`.
 */
function cuerpoContinuacion(
  proto: string,
  tema: string,
  idioma: CodigoIdioma,
  moraleja: string,
): string {
  if (idioma === 'es') {
    return (
      `La aventura de ${proto} no había terminado del todo. A la mañana siguiente, ${tema} le esperaba otra vez. Su corazón dio un brinco, ¡boing-boing!, de alegría.\n\n` +
      `Sus amigos volvieron corriendo para seguir jugando. Todos tenían ganas de descubrir algo nuevo. Y juntos prepararon una sorpresa muy especial.\n\n` +
      `Esta vez el camino tenía un pequeño enigma divertido. ${proto} pensó y pensó con mucha calma. Poco a poco, entre risas, encontraron la solución.\n\n` +
      `Cuando lo lograron, el cielo se llenó de colores. Saltaron y bailaron celebrando su hazaña. Se sentían orgullosos de haberlo intentado juntos.\n\n` +
      `Al caer la tarde, ${proto} volvió a casa contento. Se abrazó fuerte con su familia. Y soñó con la próxima aventura que vendría.${moraleja}`
    );
  }
  return (
    `${proto}'s adventure was not quite over yet. The next morning, ${tema} was waiting again. Their heart gave a little jump, boing-boing, with joy.\n\n` +
    `Their friends came running to keep on playing. Everyone was eager to discover something new. And together they prepared a very special surprise.\n\n` +
    `This time the path held a small, funny riddle. ${proto} thought and thought very calmly. Little by little, with lots of giggles, they found the answer.\n\n` +
    `When they solved it, the sky filled with colors. They jumped and danced to celebrate their feat. They felt proud of having tried together.\n\n` +
    `As evening fell, ${proto} came back home happy. They hugged their family tight. And they dreamed about the next adventure to come.${moraleja}`
  );
}
