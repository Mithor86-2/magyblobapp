import { DomainError } from '../errors.js';

export interface AchievementProps {
  id: string;
  profileId: string;
  /** Clave del logro del catálogo (US-68), p. ej. `cuentos_leidos_5`. */
  clave: string;
  /** Momento en que se desbloqueó (primer instante en que se cumplió el hito). */
  desbloqueadoEn: Date;
}

/**
 * Logro desbloqueado por un perfil (US-68). Solo materializa el **hecho** de haberlo
 * conseguido (clave + fecha); el estado de progreso se calcula en caliente desde los
 * cuentos/actividades (`domain/logros.ts`). Un logro se desbloquea una sola vez por
 * perfil (unicidad `profileId` + `clave` en la persistencia).
 */
export class Achievement {
  readonly id: string;
  readonly profileId: string;
  readonly clave: string;
  readonly desbloqueadoEn: Date;

  constructor(props: AchievementProps) {
    if (props.profileId.trim() === '') throw new DomainError('El logro necesita un profileId.');
    if (props.clave.trim() === '') throw new DomainError('El logro necesita una clave.');

    this.id = props.id;
    this.profileId = props.profileId;
    this.clave = props.clave;
    this.desbloqueadoEn = props.desbloqueadoEn;
  }
}
