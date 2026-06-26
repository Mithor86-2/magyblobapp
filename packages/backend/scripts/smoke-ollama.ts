/**
 * Smoke test manual del OllamaProvider (parte del DoD de la Fase 2). NO es un test
 * automatizado: requiere un servidor Ollama vivo con el modelo descargado
 * (`pnpm ollama:setup`). Pega contra Ollama de verdad y muestra el resultado.
 *
 *   pnpm ai:smoke                 # usa OLLAMA_BASE_URL / OLLAMA_MODEL del entorno
 *
 * Usa el OllamaProvider directo (sin FallbackProvider) para que cualquier fallo
 * del modelo se vea en pantalla en vez de caer silenciosamente al mock.
 */
import { loadConfig } from '../src/config.js';
import { OllamaProvider } from '../src/infrastructure/ai/OllamaProvider.js';
import { ChildProfile } from '../src/domain/entities/ChildProfile.js';
import { Edad } from '../src/domain/value-objects/Edad.js';
import { Idioma } from '../src/domain/value-objects/Idioma.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const provider = new OllamaProvider({
    baseUrl: config.ollamaBaseUrl,
    model: config.ollamaModel,
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

  console.log(`▶ Ollama: ${config.ollamaBaseUrl} · modelo: ${config.ollamaModel}\n`);

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
