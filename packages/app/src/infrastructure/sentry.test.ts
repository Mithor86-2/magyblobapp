import { afterEach, describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry/react-native';
import { buildSentryOptions, getSentryDsn, isSentryEnabled, scrubEvent } from './sentry';

const DSN = 'https://abc@o1.ingest.us.sentry.io/123';

describe('getSentryDsn / isSentryEnabled', () => {
  const original = process.env.EXPO_PUBLIC_SENTRY_DSN;
  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    else process.env.EXPO_PUBLIC_SENTRY_DSN = original;
  });

  it('sin DSN en env, Sentry queda desactivado (modo conforme)', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    expect(getSentryDsn()).toBeUndefined();
    expect(isSentryEnabled()).toBe(false);
  });

  it('un DSN en blanco cuenta como ausente', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = '   ';
    expect(getSentryDsn()).toBeUndefined();
    expect(isSentryEnabled()).toBe(false);
  });

  it('con DSN definido, Sentry se considera activable', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = DSN;
    expect(getSentryDsn()).toBe(DSN);
    expect(isSentryEnabled()).toBe(true);
  });
});

describe('buildSentryOptions', () => {
  const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
  const nodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
    process.env.NODE_ENV = nodeEnv;
  });

  it('no envía PII por defecto, sin tracing y con beforeSend de redacción', () => {
    const opts = buildSentryOptions(DSN);
    expect(opts.dsn).toBe(DSN);
    expect(opts.sendDefaultPii).toBe(false);
    expect(opts.tracesSampleRate).toBe(0);
    expect(opts.beforeSend).toBe(scrubEvent);
  });

  it('marca environment según __DEV__ cuando es booleano', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    expect(buildSentryOptions(DSN).environment).toBe('development');
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    expect(buildSentryOptions(DSN).environment).toBe('production');
  });

  it('sin __DEV__, cae a NODE_ENV', () => {
    delete (globalThis as { __DEV__?: boolean }).__DEV__;
    process.env.NODE_ENV = 'production';
    expect(buildSentryOptions(DSN).environment).toBe('production');
  });
});

describe('scrubEvent', () => {
  it('elimina identificadores: user, request, server_name y nombre de dispositivo', () => {
    const event: ErrorEvent = {
      type: undefined,
      user: { email: 'papa@example.com', ip_address: '1.2.3.4' },
      request: { url: 'http://x', data: { nombre: 'Lucía' } },
      server_name: 'host-de-miguel',
      contexts: { device: { name: 'iPhone de Lucía', family: 'iPhone' } },
    };

    const out = scrubEvent(event);

    expect(out.user).toBeUndefined();
    expect(out.request).toBeUndefined();
    expect(out.server_name).toBeUndefined();
    expect(out.contexts?.device?.name).toBeUndefined();
    // No borra contexto no-PII del dispositivo.
    expect(out.contexts?.device?.family).toBe('iPhone');
  });

  it('redacta correos en mensaje, excepciones y breadcrumbs', () => {
    const event: ErrorEvent = {
      type: undefined,
      message: 'Fallo al registrar tutor@correo.com',
      // Una excepción/breadcrumb sin texto: no debe romper la redacción.
      exception: { values: [{ value: 'Email duplicado: madre@dominio.es' }, { type: 'Error' }] },
      breadcrumbs: [{ message: 'login con abuelo@mail.org' }, { category: 'ui.tap' }],
    };

    const out = scrubEvent(event);

    expect(out.message).toBe('Fallo al registrar [redacted]');
    expect(out.exception?.values?.[0]?.value).toBe('Email duplicado: [redacted]');
    expect(out.breadcrumbs?.[0]?.message).toBe('login con [redacted]');
  });
});
