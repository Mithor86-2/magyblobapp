/**
 * Composition root del app: cablea la implementación concreta (infraestructura
 * HTTP) detrás de las interfaces de `domain`. Es el **único** módulo que conoce
 * la implementación; la presentación importa `api` tipado como `Api` (puertos),
 * sin saber que por debajo hay `fetch`.
 *
 * Aquí también se conecta la **sesión** (US-45): el adaptador HTTP lee los tokens
 * del store y, ante un 401, los renueva o cierra sesión, sin acoplarse al store.
 */
import type { Api } from './domain/gateways';
import { createApiGateways, getBaseUrl, type SessionStore } from './infrastructure/http';
import { useAppStore } from './presentation/store/useAppStore';

const sessionStore: SessionStore = {
  getAccessToken: () => useAppStore.getState().accessToken,
  getRefreshToken: () => useAppStore.getState().refreshToken,
  setTokens: (tokens) => useAppStore.getState().setTokens(tokens),
  onAuthExpired: () => useAppStore.getState().logout(),
};

export const api: Api = createApiGateways(getBaseUrl(), sessionStore);
