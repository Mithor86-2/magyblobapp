/**
 * Configuración de Babel del app (Expo). `babel-preset-expo` añade automáticamente el
 * plugin de worklets de `react-native-reanimated`/`react-native-worklets` cuando la
 * dependencia está instalada (US-79: page-curl del lector con gestos en el hilo de UI),
 * por lo que no hace falta declararlo a mano. Metro usa este preset para transpilar.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
