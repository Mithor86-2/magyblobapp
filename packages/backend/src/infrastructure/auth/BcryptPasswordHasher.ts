import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../domain/auth/PasswordHasher.js';

/**
 * Adaptador del puerto `PasswordHasher` sobre **bcryptjs** (US-48). Se elige
 * `bcryptjs` (JavaScript puro, sin `node-gyp`) en lugar de `bcrypt`/`argon2`
 * nativos para no romper el build reproducible de Docker ni el gate: no requiere
 * toolchain de compilación ni aprobar build scripts al instalar.
 *
 * bcrypt incorpora la sal en el propio hash (formato `$2b$<coste>$<sal+digest>`),
 * así que no hay que almacenar ni gestionar la sal aparte. El coste por defecto
 * (10 rondas) es un equilibrio razonable entre seguridad y latencia para el TFM.
 */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 10) {}

  hash(plano: string): Promise<string> {
    return bcrypt.hash(plano, this.rounds);
  }

  verify(plano: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plano, hash);
  }
}
