// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/generated/**',
      '**/*.config.*',
      'packages/app/**',
      // Worktrees integrados de Claude Code (regla de paralelismo): cada uno tiene su
      // propio gate; no deben contaminar el lint de la rama actual.
      '.claude/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Análisis estático de calidad SonarJS (bugs + code smells: complejidad cognitiva,
  // expresiones idénticas, ramas colapsables…). El `ignores` de arriba ya acota el
  // análisis al backend (app y *.config.* quedan fuera del lint raíz). Ver US-31.
  sonarjs.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Ajustes a SonarJS que chocan con idiomas deliberados del proyecto (US-31). Las
      // reglas de seguridad/correctitud se mantienen; estas tres se relajan a conciencia:
      // - todo-tag: los `// TODO` son marcadores de planificación intencionados (rastreados
      //   en Docs/planes), no deuda a romper el gate.
      'sonarjs/todo-tag': 'off',
      // - void-use: `void promesa` es el patrón elegido para marcar una promesa flotante a
      //   propósito (bootstrap del servidor, errorHandler de Fastify).
      'sonarjs/void-use': 'off',
      // - no-nested-conditional: el contenido bilingüe ES/EN se expresa como ternario
      //   anidado (`cond ? (idioma === 'es' ? a : b) : …`) de forma consistente; aplanarlo
      //   resta legibilidad y tocaría la lógica de prompts (fuera del alcance de US-31).
      'sonarjs/no-nested-conditional': 'off',
    },
  },
  {
    // En tests usamos URLs http:// hacia servicios internos simulados (p. ej. el contenedor
    // Ollama en la red de docker); no hay transporte en claro real que proteger.
    files: ['packages/backend/test/**/*.ts'],
    rules: {
      'sonarjs/no-clear-text-protocols': 'off',
    },
  },

  // Estándar de documentación (US-65): exige un bloque de documentación en los
  // **exports públicos** del código fuente del backend (clases —casos de uso,
  // providers— y funciones exportadas —rutas, factories—). No usamos el preset
  // `flat/recommended` a propósito: la convención del proyecto es **prosa en
  // español**, no TSDoc formal, así que solo exigimos la *presencia* del bloque
  // (`require-jsdoc`), no `@param`/`@returns`. Tests y código generado quedan fuera
  // (el `ignores` global excluye `**/generated/**`; aquí acotamos a `src`).
  {
    files: ['packages/backend/src/**/*.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
          },
          // Los métodos internos y los constructores no necesitan bloque propio:
          // la clase ya lleva su documentación de propósito.
          checkConstructors: false,
          exemptEmptyFunctions: false,
        },
      ],
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
