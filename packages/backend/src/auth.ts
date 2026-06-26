import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Config } from './config.js';

/**
 * Autenticación de la sesión del guardián con JWT (US-45).
 *
 * El login emite un **access token** de vida corta y un **refresh token** de
 * vida larga, firmados con un único secreto y distinguidos por el claim `type`
 * (YAGNI: no se separan secretos/namespaces). Las rutas de datos se protegen con
 * el decorador `authenticate` (hook `onRequest`), que rechaza con 401 cualquier
 * petición sin un access token válido. El refresh es **stateless** (no hay tabla
 * en BD ni revocación server-side); el "logout" lo hace el cliente descartando
 * los tokens. No introduce red externa ni terceros (no afecta a C-2/C-5).
 */
export interface TokenPayload {
  guardianId: string;
  email: string;
  type: 'access' | 'refresh';
}

// Tipa el payload/usuario que maneja @fastify/jwt (`request.user`, `jwtSign`...).
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

// El decorador `authenticate` protege las rutas como hook `onRequest`.
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/** Sesión sin autorización válida → HTTP 401 (vía manejo de errores centralizado). */
export class UnauthorizedError extends Error {
  readonly statusCode = 401;
  constructor(message = 'No autorizado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/** Datos mínimos del guardián necesarios para firmar su sesión. */
export interface SessionGuardian {
  id: string;
  email: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Registra @fastify/jwt y el decorador `authenticate`. Debe llamarse **antes** de
 * registrar las rutas, para que `app.authenticate` exista cuando se referencia en
 * las opciones de cada ruta protegida.
 */
export async function registerAuth(app: FastifyInstance, config: Config): Promise<void> {
  await app.register(fastifyJwt, {
    secret: config.auth.secret,
    sign: { expiresIn: config.auth.accessTtl },
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    let payload: TokenPayload;
    try {
      payload = await request.jwtVerify<TokenPayload>();
    } catch {
      throw new UnauthorizedError('Token de acceso ausente o inválido');
    }
    if (payload.type !== 'access') {
      throw new UnauthorizedError('Se requiere un token de acceso');
    }
  });
}

/** Firma el par de tokens (access corto + refresh largo) para un guardián. */
export async function signSession(
  reply: FastifyReply,
  config: Config,
  guardian: SessionGuardian,
): Promise<SessionTokens> {
  const base = { guardianId: guardian.id, email: guardian.email } as const;
  const accessToken = await reply.jwtSign({ ...base, type: 'access' });
  const refreshToken = await reply.jwtSign(
    { ...base, type: 'refresh' },
    { expiresIn: config.auth.refreshTtl },
  );
  return { accessToken, refreshToken };
}

/**
 * Verifica un refresh token (recibido en el cuerpo, no en la cabecera) y devuelve
 * su payload. Lanza `UnauthorizedError` (401) si es inválido, ha expirado o no es
 * de tipo refresh.
 */
export function verifyRefreshToken(app: FastifyInstance, token: string): TokenPayload {
  let payload: TokenPayload;
  try {
    payload = app.jwt.verify<TokenPayload>(token);
  } catch {
    throw new UnauthorizedError('Refresh token inválido o expirado');
  }
  if (payload.type !== 'refresh') {
    throw new UnauthorizedError('Se requiere un refresh token');
  }
  return payload;
}
