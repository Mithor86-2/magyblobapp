/**
 * Configuración derivada de variables de entorno, con valores por defecto
 * seguros para desarrollo. Centralizada aquí para no leer process.env disperso.
 */
export interface Config {
  nodeEnv: string;
  port: number;
  logLevel: string;
  aiProvider: 'mock' | 'local' | 'cloud';
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseAiProvider(value: string | undefined): Config['aiProvider'] {
  return value === 'local' || value === 'cloud' ? value : 'mock';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: parsePort(env.PORT, 3000),
    logLevel: env.LOG_LEVEL ?? 'info',
    aiProvider: parseAiProvider(env.AI_PROVIDER),
  };
}
