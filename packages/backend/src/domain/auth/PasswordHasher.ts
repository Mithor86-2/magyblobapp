/**
 * Puerto de hashing de contraseñas (US-48). Una sola interfaz, como `AIProvider`
 * o `TTSProvider`: la implementación concreta (bcrypt) vive en infraestructura, de
 * modo que los casos de uso (`RegisterGuardian`, `LoginGuardian`) no dependen de la
 * librería y los tests la sustituyen por un doble determinista.
 *
 * El dominio nunca conoce ni persiste la contraseña en claro: `hash` deriva un
 * valor irreversible y `verify` la compara en tiempo (idealmente) constante. El
 * `hash` resultante es lo único que llega a la entidad `Guardian` y a la BD.
 */
export interface PasswordHasher {
  /** Deriva el hash de una contraseña en claro (con sal interna). */
  hash(plano: string): Promise<string>;
  /** Comprueba si una contraseña en claro corresponde a un hash dado. */
  verify(plano: string, hash: string): Promise<boolean>;
}
