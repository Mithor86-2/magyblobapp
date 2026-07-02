/**
 * Mapa de cada opción de los vocabularios (tema / estilo / enseñanza) a su **icono**
 * semántico del wrapper `Icon` (US-89, ajuste #1). Se centraliza aquí para que las
 * pantallas (Cuentos, Crear perfil, Dashboard) usen los **mismos iconos** por opción.
 */
import type { Ensenanza, Estilo, Tema } from '../domain/types';
import type { IconName } from './components/Icon';

const TEMA_ICON: Record<Tema, IconName> = {
  animales: 'tema-animales',
  espacio: 'tema-espacio',
  magia: 'tema-magia',
  aventuras: 'tema-aventuras',
  musica: 'tema-musica',
};

const ESTILO_ICON: Record<Estilo, IconName> = {
  aventura: 'estilo-aventura',
  divertido: 'estilo-divertido',
  educativo: 'estilo-educativo',
};

const ENSENANZA_ICON: Record<Ensenanza, IconName> = {
  amistad: 'ens-amistad',
  emociones: 'ens-emociones',
  valentia: 'ens-valentia',
  honestidad: 'ens-honestidad',
};

/** Icono del tema (`animales`, `espacio`, …). */
export function temaIcon(tema: Tema): IconName {
  return TEMA_ICON[tema];
}

/** Icono del estilo (`aventura`, `divertido`, `educativo`). */
export function estiloIcon(estilo: Estilo): IconName {
  return ESTILO_ICON[estilo];
}

/** Icono de la enseñanza (`amistad`, `emociones`, `valentia`, `honestidad`). */
export function ensenanzaIcon(ensenanza: Ensenanza): IconName {
  return ENSENANZA_ICON[ensenanza];
}
