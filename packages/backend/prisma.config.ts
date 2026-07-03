import { defineConfig } from 'prisma/config';

/**
 * Configuración de Prisma CLI/Migrate (Prisma 7). Desde v7 la URL de conexión ya no
 * vive en `datasource.url` del schema: aquí se declara para Migrate (`migrate deploy`,
 * `migrate dev`) y el runtime la usa vía el driver adapter `@prisma/adapter-pg`
 * (ver `src/infrastructure/db/prismaClient.ts`).
 *
 * Se lee `process.env.DATABASE_URL` directamente (no el helper `env()` de prisma/config,
 * que es estricto y falla al cargar la config si la var no está). `prisma generate` corre
 * sin base de datos (CI, build de Docker, local sin `.env`) y no necesita la URL; `migrate
 * deploy` sí la tiene en el entorno (Docker/Render/CI). Ver Docs/modelo-datos.md.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
