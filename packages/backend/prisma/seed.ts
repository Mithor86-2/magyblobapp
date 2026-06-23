import { PrismaClient } from '../src/generated/prisma/index.js';

/**
 * Seed de AppSetting: configuración ajustable en caliente (prompts, modelo y
 * parámetros de generación). Ver Docs/modelo-datos.md. NO contiene secretos
 * (las claves de API y el DATABASE_URL siguen en variables de entorno).
 *
 * Las plantillas usan placeholders `{clave}` que resuelve la capa de IA:
 * cuento → {nombre} {edad} {tema} {estilo} {idiomaNombre}; actividad → {n} {categoria} {nombre} {edad}.
 * Idempotente (upsert por `key`): se puede reejecutar sin duplicar.
 */
const SETTINGS: { key: string; value: string; descripcion: string }[] = [
  { key: 'ai.model.local', value: 'gemma:2b', descripcion: 'Modelo Ollama por defecto.' },
  // OJO (US-28): el system prompt del cuento NO se siembra. Es **por idioma** y vive en el código
  // (`INSTRUCCION_SEGURIDAD` de prompts.ts, ES/EN, con las reglas del prompt maestro). Si se
  // sembrara aquí (un único texto en español) pisaría el system por idioma y los modelos escribirían
  // en español aunque el perfil fuera `en`. La plantilla (`prompt.story.template`) sí es configurable.
  {
    key: 'prompt.story.template',
    value:
      'Escribe un cuento corto (4 a 6 frases) para {nombre}, de {edad} años, sobre ' +
      '"{tema}" con un estilo {estilo}. {nombre} es el protagonista. Escríbelo en {idiomaNombre}. ' +
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
  {
    // Parámetros configurables del cuento (US-26+): longitud, rima y lista de formatos
    // de la que se elige uno AL AZAR en cada generación (variación dinámica). Si la
    // clave falta o es inválida, se usa el comportamiento por defecto (sin bloque).
    key: 'prompt.story.params',
    value: JSON.stringify({
      palabrasMin: 50,
      palabrasMax: 120,
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
