// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/generated/**',
      '**/*.config.*',
      'packages/app/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Frontera de capas (invariante del proyecto): las dependencias apuntan hacia
  // dentro. /domain no conoce a nadie; application no conoce infraestructura.
  // Si el lint bloquea un import, el diseño está mal, no el lint.
  {
    files: ['packages/backend/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/application/**',
                '**/infrastructure/**',
                '**/routes/**',
                '**/config',
                '**/config.js',
                '**/server',
                '**/server.js',
              ],
              message:
                '/domain no puede importar de capas externas. Las dependencias apuntan hacia dentro.',
            },
          ],
          paths: [
            { name: 'fastify', message: '/domain no depende de frameworks (Fastify).' },
            { name: '@prisma/client', message: '/domain no depende de ORM/IO (Prisma).' },
            { name: 'pino', message: '/domain no depende de logging (pino).' },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/backend/src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**', '**/routes/**'],
              message:
                'La capa de aplicación no conoce la infraestructura; depende de las interfaces de /domain.',
            },
          ],
          paths: [
            { name: 'fastify', message: 'La aplicación no depende del framework HTTP (Fastify).' },
            { name: '@prisma/client', message: 'La aplicación no depende del ORM (Prisma).' },
          ],
        },
      ],
    },
  },

  prettier,
);
