import type { AuditLog } from '../entities/AuditLog.js';

/** Puerto de persistencia del registro de auditoría. */
export interface AuditLogRepository {
  save(entry: AuditLog): Promise<void>;
}
