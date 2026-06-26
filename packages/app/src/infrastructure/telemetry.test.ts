import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Breadcrumb } from '@sentry/react-native';
import { setBreadcrumbSink, trackAction, trackApi, trackNavigation } from './telemetry';

/**
 * Tests del helper de telemetría (US-42). Verifican la categoría/nivel de cada
 * breadcrumb y, sobre todo, que sin sink cableado (Sentry inactivo) son no-op y no
 * transportan PII (solo enums/ids/contadores).
 */
describe('telemetry', () => {
  afterEach(() => setBreadcrumbSink(undefined));

  function withSink(): Breadcrumb[] {
    const crumbs: Breadcrumb[] = [];
    setBreadcrumbSink((b) => crumbs.push(b));
    return crumbs;
  }

  it('sin sink cableado (Sentry inactivo), los wrappers son no-op', () => {
    // No debe lanzar ni hacer nada al no haber destino.
    expect(() => {
      trackNavigation('Cuentos');
      trackApi({ method: 'GET', path: '/x', ok: true });
      trackAction('algo');
    }).not.toThrow();
  });

  it('trackNavigation emite un breadcrumb navigation con el nombre de ruta', () => {
    const crumbs = withSink();
    trackNavigation('Cuentos');
    expect(crumbs).toEqual([{ category: 'navigation', level: 'info', message: 'Cuentos' }]);
  });

  it('trackApi en éxito emite nivel info con status y ok', () => {
    const crumbs = withSink();
    trackApi({ method: 'POST', path: '/stories', status: 201, ok: true });
    expect(crumbs[0]).toEqual({
      category: 'api',
      level: 'info',
      message: 'POST /stories',
      data: { status: 201, ok: true },
    });
  });

  it('trackApi en error emite nivel error', () => {
    const crumbs = withSink();
    trackApi({ method: 'GET', path: '/x', status: 500, ok: false });
    expect(crumbs[0]?.level).toBe('error');
    expect(crumbs[0]?.data).toEqual({ status: 500, ok: false });
  });

  it('trackApi sin status (fallo de red) omite status en data', () => {
    const crumbs = withSink();
    trackApi({ method: 'POST', path: '/guardians', ok: false });
    expect(crumbs[0]?.data).toEqual({ ok: false });
  });

  it('trackAction emite un breadcrumb ui con datos no-PII', () => {
    const crumbs = withSink();
    trackAction('story.generate', { tema: 'magia', estilo: 'aventura' });
    expect(crumbs[0]).toEqual({
      category: 'ui',
      level: 'info',
      message: 'story.generate',
      data: { tema: 'magia', estilo: 'aventura' },
    });
  });

  it('setBreadcrumbSink(undefined) desactiva el destino', () => {
    const sink = vi.fn();
    setBreadcrumbSink(sink);
    setBreadcrumbSink(undefined);
    trackNavigation('Inicio');
    expect(sink).not.toHaveBeenCalled();
  });
});
