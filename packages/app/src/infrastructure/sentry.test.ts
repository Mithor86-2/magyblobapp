import { afterEach, describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry/react-native';
import {
  buildSentryOptions,
  getSentryDsn,
  isSentryEnabled,
  scrubBreadcrumb,
  scrubEvent,
  setActiveChildName,
} from './sentry';

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

  it('acota los breadcrumbs y redacta su PII con beforeBreadcrumb (US-42)', () => {
    const opts = buildSentryOptions(DSN);
    expect(opts.maxBreadcrumbs).toBe(50);
    expect(opts.beforeBreadcrumb).toBe(scrubBreadcrumb);
  });

  it('etiqueta la release cuando se le pasa la versión del app', () => {
    expect(buildSentryOptions(DSN, 'magyblob-app@1.2.3').release).toBe('magyblob-app@1.2.3');
    expect(buildSentryOptions(DSN).release).toBeUndefined();
  });

  it('activa debug solo en desarrollo (según environment)', () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    expect(buildSentryOptions(DSN).debug).toBe(true);
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    expect(buildSentryOptions(DSN).debug).toBe(false);
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
  afterEach(() => setActiveChildName(undefined));

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

  it('redacta el nombre del niño activo en mensaje, excepciones y breadcrumbs', () => {
    setActiveChildName('Lucía');
    const event: ErrorEvent = {
      type: undefined,
      // Aparece dentro del texto de un cuento; sin distinguir mayúsculas.
      message: 'Error generando el cuento de Lucía la valiente',
      // Una excepción/breadcrumb sin texto: no debe romper la redacción.
      exception: { values: [{ value: 'lucía no encontrada' }, { type: 'Error' }] },
      breadcrumbs: [
        { message: 'perfil Lucía cargado', data: { nombre: 'Lucía', edad: 4 } },
        { category: 'ui.tap' },
      ],
    };

    const out = scrubEvent(event);

    expect(out.message).toBe('Error generando el cuento de [child] la valiente');
    expect(out.exception?.values?.[0]?.value).toBe('[child] no encontrada');
    expect(out.breadcrumbs?.[0]?.message).toBe('perfil [child] cargado');
    // También redacta el nombre del niño en los valores de texto de `data`.
    expect(out.breadcrumbs?.[0]?.data).toEqual({ nombre: '[child]', edad: 4 });
  });

  it('NO redacta el email del adulto (puede salir según la política)', () => {
    setActiveChildName('Lucía');
    const event: ErrorEvent = {
      type: undefined,
      message: 'Fallo al registrar tutor@correo.com',
    };

    expect(scrubEvent(event).message).toBe('Fallo al registrar tutor@correo.com');
  });

  it('sin perfil activo registrado, no redacta texto libre', () => {
    setActiveChildName(undefined);
    const event: ErrorEvent = { type: undefined, message: 'Error genérico sin nombres' };
    expect(scrubEvent(event).message).toBe('Error genérico sin nombres');
  });
});

describe('scrubBreadcrumb (beforeBreadcrumb, US-42)', () => {
  afterEach(() => setActiveChildName(undefined));

  it('redacta el nombre del niño en message y en los valores de texto de data', () => {
    setActiveChildName('Lucía');
    const out = scrubBreadcrumb({
      category: 'navigation',
      message: 'pantalla de Lucía',
      data: { perfil: 'Lucía', status: 200 },
    });

    expect(out.message).toBe('pantalla de [child]');
    expect(out.data).toEqual({ perfil: '[child]', status: 200 });
  });

  it('devuelve el breadcrumb intacto cuando no hay message ni data', () => {
    setActiveChildName('Lucía');
    const crumb = { category: 'ui.tap' };
    expect(scrubBreadcrumb(crumb)).toBe(crumb);
  });

  it('sin perfil activo, no toca el contenido', () => {
    const out = scrubBreadcrumb({ message: 'GET /x', data: { status: 500 } });
    expect(out.message).toBe('GET /x');
    expect(out.data).toEqual({ status: 500 });
  });
});
