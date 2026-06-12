import { PrismaClient } from '../src/generated/prisma/index.js';

/**
 * Seed de AppSetting: configuración ajustable en caliente (prompts, modelo y
 * parámetros de generación). Ver Docs/modelo-datos.md. NO contiene secretos
 * (las claves de API y el DATABASE_URL siguen en variables de entorno).
 *
 * Las plantillas usan placeholders `{clave}` que resuelve la capa de IA:
 * cuento → {nombre} {edad} {tema} {estilo} {idioma}; actividad → {n} {categoria} {nombre} {edad}.
 * Idempotente (upsert por `key`): se puede reejecutar sin duplicar.
 */
const SETTINGS: { key: string; value: string; descripcion: string }[] = [
  { key: 'ai.model.local', value: 'gemma:2b', descripcion: 'Modelo Ollama por defecto.' },
  {
    key: 'prompt.story.system',
    value:
      'Eres un cuentacuentos para niños de 2 a 6 años. Lenguaje sencillo y tono ' +
      'cálido; sin violencia, miedo ni temas para adultos.',
    descripcion: 'System prompt de generateStory.',
  },
  {
    key: 'prompt.story.template',
    value:
      'Escribe un cuento corto (4 a 6 frases) para {nombre}, de {edad} años, sobre ' +
      '"{tema}" con un estilo {estilo}. {nombre} es el protagonista. Escríbelo en {idioma}. ' +
      'Devuelve un título breve y el cuerpo del cuento.',
    descripcion: 'Plantilla del cuento.',
  },
  {
    key: 'prompt.activity.system',
    value:
      'Diseñas actividades educativas seguras y sencillas para niños de 2 a 6 años, ' +
      'apropiadas a su edad y sin riesgos.',
    descripcion: 'System prompt de recommendActivities.',
  },
  {
    key: 'prompt.activity.template',
    value:
      'Propón {n} actividades sencillas para {nombre}, de {edad} años, de la categoría ' +
      '{categoria}. Cada una con título, descripción breve, duración en minutos y nivel 1 a 3.',
    descripcion: 'Plantilla de actividades.',
  },
  { key: 'story.maxTokens', value: '800', descripcion: 'Límite de longitud del cuento.' },
  { key: 'story.temperature', value: '0.8', descripcion: 'Creatividad del LLM (0-1).' },
  { key: 'activity.count', value: '3', descripcion: 'Nº de actividades a generar.' },
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
