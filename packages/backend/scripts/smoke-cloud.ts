/**
 * Smoke test manual del CloudProvider (parte del DoD de la feature 14). NO es un
 * test automatizado: requiere una API key real del proveedor en el entorno
 * (p. ej. GROQ_API_KEY). Pega contra el proveedor cloud de verdad y muestra el
 * resultado.
 *
 *   pnpm ai:smoke:cloud                       # target groq, modelo por defecto
 *   SMOKE_CLOUD_TARGET=gemini SMOKE_CLOUD_MODEL=gemini-2.0-flash pnpm ai:smoke:cloud
 *
 * Usa el CloudProvider directo (sin FallbackProvider) para que cualquier fallo del
 * proveedor se vea en pantalla en vez de caer silenciosamente al mock. La key se
 * lee de env (config.cloudApiKeys), nunca de la BD.
 */
import { loadConfig } from '../src/config.js';
import { CloudProvider } from '../src/infrastructure/ai/CloudProvider.js';
import { CLOUD_PRESETS, esCloudTarget } from '../src/infrastructure/ai/cloudPresets.js';
import { ChildProfile } from '../src/domain/entities/ChildProfile.js';
import { Edad } from '../src/domain/value-objects/Edad.js';
import { Idioma } from '../src/domain/value-objects/Idioma.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const target = process.env.SMOKE_CLOUD_TARGET ?? 'groq';
  const model = process.env.SMOKE_CLOUD_MODEL ?? 'llama-3.3-70b-versatile';

  if (!esCloudTarget(target)) {
    throw new Error(`Target desconocido: ${target}. Opciones: ${Object.keys(CLOUD_PRESETS).join(', ')}.`);
  }
  const apiKey = config.cloudApiKeys[target];
  if (apiKey === undefined) {
    throw new Error(`Falta la API key en env (${CLOUD_PRESETS[target].apiKeyEnv}) para el target "${target}".`);
  }

  const provider = new CloudProvider({
    baseUrl: CLOUD_PRESETS[target].baseUrl,
    apiKey,
    model,
    timeoutMs: config.aiTimeoutMs,
  });

  const perfil = new ChildProfile({
    id: 'smoke-1',
    guardianId: 'smoke-g',
    nombre: 'Lola',
    edad: Edad.create(5),
    idioma: Idioma.create('es'),
    avatar: 'a1',
    intereses: ['animales'],
    creadoEn: new Date(),
  });

  console.log(`▶ Cloud: ${CLOUD_PRESETS[target].baseUrl} · target: ${target} · modelo: ${model}\n`);

  console.log('— generateStory —');
  const story = await provider.generateStory({ perfil, tema: 'animales', estilo: 'aventura' });
  console.log(`Título: ${story.titulo}\n${story.cuerpo}\n`);

  console.log('— recommendActivities —');
  const actividades = await provider.recommendActivities({ perfil, cantidad: 3 });
  for (const a of actividades) {
    console.log(`• [${a.categoria}] ${a.titulo} — ${a.descripcion}`);
  }
}

main().catch((error: unknown) => {
  console.error('✖ Smoke test falló:', error instanceof Error ? error.message : error);
  process.exit(1);
});
