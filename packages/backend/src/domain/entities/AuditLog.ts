import { DomainError } from '../errors.js';
import { esAccionAudit, type AccionAudit } from '../vocabulary.js';

export interface AuditLogProps {
  id: string;
  /** Adulto que realiza la acción; opcional (p. ej. acciones del sistema). */
  guardianId?: string;
  accion: AccionAudit;
  /** Entidad afectada: "Guardian" | "ChildProfile" | "Story" | "Activity". */
  entidad: string;
  entidadId: string;
  metadatos?: Record<string, unknown>;
  creadoEn: Date;
}

/**
 * Registro de una acción sensible del adulto (incluido el consentimiento), para
 * trazabilidad y para poder acreditarla. Ver Docs/cumplimiento-menores.md.
 */
export class AuditLog {
  readonly id: string;
  readonly guardianId?: string;
  readonly accion: AccionAudit;
  readonly entidad: string;
  readonly entidadId: string;
  readonly metadatos?: Record<string, unknown>;
  readonly creadoEn: Date;

  constructor(props: AuditLogProps) {
    if (!esAccionAudit(props.accion)) throw new DomainError(`Acción inválida: "${props.accion}".`);
    if (props.entidad.trim() === '') throw new DomainError('El audit log necesita una entidad.');

    this.id = props.id;
    this.guardianId = props.guardianId;
    this.accion = props.accion;
    this.entidad = props.entidad;
    this.entidadId = props.entidadId;
    this.metadatos = props.metadatos;
    this.creadoEn = props.creadoEn;
  }
}
