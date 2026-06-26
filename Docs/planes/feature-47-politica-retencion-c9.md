# Plan — Feature 47: Política de conservación de datos (C-9, Fase 6)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo**. Cierra con `cerrar-feature`.

## Contexto

Cierra el último punto del ítem de **cumplimiento** de la Fase 6 detectado en la auditoría
(2026-06-25): **C-9 (limitación de conservación)**, que estaba como "Pend." en
[../cumplimiento-menores.md](../cumplimiento-menores.md). Lo que C-9 pide literalmente es
**"documentar política de purga"**, no implementarla.

Decisiones con el usuario (2026-06-25):

- **Opción A (solo documentar).** Se define y documenta la política de retención; la purga automática
  programada se deja para **Fase 7/producción**.
- **C-7 (política de privacidad) NO entra aquí:** el propio doc de cumplimiento la sitúa como
  entregable de **Fase 7** (documentación + data-safety). No bloquea la Fase 6.
- **Sin US nueva:** es documentación de política de cumplimiento, sin comportamiento testable. Traza
  por la fila **C-9** de `cumplimiento-menores.md` y el ítem de cumplimiento de la Fase 6.

Estado de partida:

- ✅ Borrado en cascada por baja de cuenta/perfil (C-8): `InteractionEvent` por `Cascade`, `AuditLog`
  por `SetNull`. Cubre el derecho de supresión a iniciativa del usuario.
- ✅ `InteractionEvent` y `AuditLog` tienen `creadoEn` (timestamp) → base para una purga por antigüedad.
- ❌ No hay política de retención documentada ni job de purga.

## Historias cubiertas

- Sin US (documentación de cumplimiento). Traza: C-9 en
  [../cumplimiento-menores.md](../cumplimiento-menores.md) e ítem de cumplimiento de la
  [Fase 6](../phases.md).

## Tareas

- [x] ✅ Documentar la **política de conservación** en `cumplimiento-menores.md`: ventanas
      (`InteractionEvent` 90 días, `AuditLog` 365 días; consentimiento mientras exista la cuenta),
      supresión por baja (cascada, ya implementada) y enforcement (purga automática → Fase 7).
- [x] ✅ Actualizar la fila **C-9** de la tabla de "Pend." a documentado.
- [x] ✅ Actualizar `phases.md`: ítem de cumplimiento de la Fase 6 cerrado (C-9 documentado; C-7 →
      Fase 7). Con esto **la Fase 6 (HITO 2) cierra**.
- [ ] 🔄 Gate verde + cierre con `cerrar-feature`. Doc-only: bump **patch en la raíz** (0.27.0→0.27.1),
      sin CHANGELOG de paquete (ningún paquete afectado). `finish` tras confirmación.

## Riesgos / pendientes

- **C-7** (política de privacidad + data-safety) queda explícitamente para la **Fase 7**.
- La **purga automática** (job/comando `PurgeExpiredEvents`) se difiere a Fase 7/producción; si se
  quisiera hacer cumplir en el MVP, sería una feature aparte (Opción B descartada ahora).
