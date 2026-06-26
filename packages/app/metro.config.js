// Configuración de Metro para el monorepo pnpm. Expo SDK 52+ autodetecta monorepos,
// pero declaramos el puente explícitamente para que la resolución de paquetes sea
// determinista con el linker aislado de pnpm (symlinks): se vigila la raíz del
// workspace y se resuelve primero en el paquete y luego en la raíz.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
