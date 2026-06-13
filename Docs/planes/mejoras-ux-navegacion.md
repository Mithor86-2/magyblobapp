# Plan — Fase de mejoras: UX y navegación

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md) (sección **Fase de mejoras → UX y navegación**). Aquí va el **cómo**.

## Contexto

Pulido de experiencia diferido de la Fase 5.5. **Solo app** (`@magyblob/app`); el backend no se
toca.

Qué existe ya (✅):

- ✅ Avisos/confirmaciones con `Alert.alert` **nativo** en Consent, Login, Parental, CreateProfile,
  Actividades, Generador de cuentos (los componentes con manejo de error).
- ✅ Stack de navegación con `headerShown: false` (App.tsx) → pantallas de onboarding y zona de
  adultos **sin botón "atrás"** (hueco detectado en la 5.5: desde Login no se podía volver).
- ✅ Tokens de tema (`theme/tokens.ts`), componentes `BubblyButton`, `Screen`.

Qué falta (❌): modal propio reutilizable que sustituya las alertas del sistema, y cabecera de
navegación con "atrás" en el stack (conservando las tabs sin cabecera).

### Decisiones

- **Modal por contexto + hook imperativo.** Un `DialogProvider` monta un único `<Modal>` a nivel
  raíz y expone `useDialog()` con `alert({title,message})` y `confirm({title,message,confirmLabel,
destructive,onConfirm})`. Las alertas son imperativas (se lanzan desde handlers), así que un hook
  imperativo encaja mejor que estado por pantalla y evita duplicar el `<Modal>` en cada una.
- **Header solo en el stack, tabs intactas.** Se activa `headerShown` en el stack raíz con estilo de
  tema; el navegador de pestañas (`Main`) mantiene su propio `headerShown:false` (la zona infantil
  no cambia). Bienvenida sin "atrás" (es la inicial).

## Historias cubiertas

- **US-23** — Avisos y confirmaciones dentro de la app (modal propio)
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-23)).
- **US-24** — Navegación con cabecera y "atrás"
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-24)).

## Tareas

### F1 — Modal propio (US-23)

- [ ] ❌ Componente `AppDialog` (presentación del `<Modal>` con tokens de tema: título, mensaje,
      botones; variante destructiva).
- [ ] ❌ `DialogProvider` + `useDialog()` (`alert`/`confirm`) en `presentation/`; montar el provider
      en `App.tsx` por encima de la navegación.
- [ ] ❌ Migrar las pantallas que usan `Alert.alert` → `useDialog()`: Consent, Login, Parental,
      CreateProfile, Actividades, Generador de cuentos (y revisar Historial).
- [ ] ❌ Verificar que **no queda** ningún `Alert.alert` del sistema (grep) en `src/`.

### F2 — Header con "atrás" (US-24)

- [ ] ❌ Activar cabecera del stack en `App.tsx` (`headerShown: true` + `screenOptions` con tema:
      color, tipografía Quicksand, tinte del back). Título por pantalla (`options.title`).
- [ ] ❌ Tabs (`Main`) sin cabecera del stack (la pantalla `Main` oculta su header; las tabs ya van
      `headerShown:false`). Bienvenida sin "atrás".
- [ ] ❌ Repasar navegaciones `replace`/`reset` para que el "atrás" sea coherente (no volver a
      pantallas ya superadas del onboarding).

### Cierre

- [ ] ❌ Gate `pnpm check` verde + bundle (`expo export`).
- [ ] ❌ CHANGELOG del app (Unreleased) y docs; cierre con la skill **cerrar-feature** (versión
      SemVer, CHANGELOG fechado, merge tras confirmación y pruebas con el usuario).

## DoD

Avisos y confirmaciones se muestran con el modal de la app (cero `Alert.alert` del sistema); las
pantallas del stack tienen "atrás" y las tabs conservan su diseño sin cabecera. `pnpm check` verde +
bundle + pruebas con el usuario.
