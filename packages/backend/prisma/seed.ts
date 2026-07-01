import { PrismaClient } from '../src/generated/prisma/index.js';

/**
 * Seed de AppSetting: configuración ajustable en caliente (prompts, modelo y
 * parámetros de generación). Ver Docs/modelo-datos.md. NO contiene secretos
 * (las claves de API y el DATABASE_URL siguen en variables de entorno).
 *
 * Las plantillas usan placeholders `{clave}` que resuelve la capa de IA:
 * cuento → {nombre} {edad} {temas} {estilos} {idiomaNombre} (US-47: listas legibles;
 * {tema}/{estilo} siguen aceptándose como alias); actividad → {n} {categoria} {nombre} {edad}.
 * Idempotente (upsert por `key`): se puede reejecutar sin duplicar.
 */
const SETTINGS: { key: string; value: string; descripcion: string }[] = [
  { key: 'ai.model.local', value: 'gemma:2b', descripcion: 'Modelo Ollama por defecto.' },
  // OJO (US-28): ni el system prompt ni la plantilla del cuento se siembran. El system es **por
  // idioma** y vive en el código (`INSTRUCCION_SEGURIDAD` de prompts.ts, ES/EN, con las reglas del
  // prompt maestro). La plantilla por defecto también vive en código (`buildStoryPrompt`), que SÍ
  // respeta `prompt.story.params` (longitud), intereses, tono y formato. Ambos siguen siendo
  // configurables vía `AppSetting` (`prompt.story.system`/`prompt.story.template`) si un adulto los
  // define, pero NO se siembra un default: un `prompt.story.template` fijo pisaba la longitud
  // (hardcodeaba "4 a 6 frases") e ignoraba los params (US-18/US-36).
  {
    key: 'prompt.activity.system',
    value:
      'Diseñas actividades educativas seguras y sencillas para niños de 2 a 6 años, ' +
      'apropiadas a su edad y sin riesgos.',
    descripcion: 'System prompt de recommendActivities.',
  },
  {
    key: 'prompt.activity.template',
    // US-67: actividades más significativas para 2-6 años. La plantilla coincide con el default en
    // código (buildActivitiesPrompt): pide al menos 6 pasos detallados, objetivo de aprendizaje y
    // materiales sencillos de casa, y dirige las instrucciones al adulto por su parentesco
    // ({cuidador}). Placeholders soportados por `rellenar`:
    // {n} {nombre} {edad} {categoria} {categorias} {intereses} {tono} {cuidador}.
    value:
      'Propón {n} actividades sencillas y significativas para {nombre}, de {edad} años, de la ' +
      'categoría {categoria}. Cada una con título, descripción breve, un objetivo de aprendizaje ' +
      'breve, una lista de materiales sencillos que suele haber en casa, unas instrucciones en un ' +
      'paso a paso claro de al menos 6 pasos numerados, detallados y concretos (cada paso explica ' +
      'qué hace {cuidador} y qué hace el niño), aptos para niños de 2 a 6 años, duración en minutos ' +
      'y nivel 1 a 3. En las instrucciones refiérete al adulto como "{cuidador}", no como "el adulto".',
    descripcion:
      'Plantilla de actividades (US-67: ≥6 pasos detallados, objetivo y materiales de casa).',
  },
  { key: 'story.maxTokens', value: '800', descripcion: 'Límite de longitud del cuento.' },
  { key: 'story.temperature', value: '0.7', descripcion: 'Creatividad del LLM (0-1).' },
  {
    // Parámetros configurables del cuento (US-26+): longitud, rima y lista de formatos
    // de la que se elige uno AL AZAR en cada generación (variación dinámica). Si la
    // clave falta o es inválida, se usa el comportamiento por defecto (sin bloque).
    key: 'prompt.story.params',
    value: JSON.stringify({
      // US-47: se sube el límite de palabras para un cuento más desarrollado (antes
      // 150-200). 200-350 da margen a varios párrafos sin agotar el contexto del
      // modelo local (gemma:2b) ni alargar en exceso la lectura para 2-6 años.
      palabrasMin: 200,
      palabrasMax: 350,
      rima: false,
      formatos: ['cuento', 'fabula', 'poema'],
    }),
    descripcion: 'Parámetros del cuento: longitud, rima y formatos (uno al azar por cuento).',
  },
  { key: 'activity.count', value: '3', descripcion: 'Nº de actividades a generar.' },
  {
    // Selección del proveedor cloud. Solo selectores NO secretos; la API key va en
    // env (p. ej. GROQ_API_KEY). Por decisión del proyecto, el modo cloud está
    // ACTIVO por defecto (target groq); si falta la key del target, cae al modo
    // base (mock/local) automáticamente. Ver ADR 0002 y cumplimiento-menores.md (C-5).
    key: 'ai.cloud',
    value: JSON.stringify({ activo: true, target: 'groq', model: 'llama-3.3-70b-versatile' }),
    descripcion:
      'Modo cloud {activo,target,model}. Key del target en env. ON por defecto (cae a base sin key).',
  },
];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    for (const s of SETTINGS) {
      await prisma.appSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, descripcion: s.descripcion },
        create: s,
      });
    }
    console.log(`✔ Seed de AppSetting: ${SETTINGS.length} claves.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('✖ Seed falló:', error instanceof Error ? error.message : error);
  process.exit(1);
});
