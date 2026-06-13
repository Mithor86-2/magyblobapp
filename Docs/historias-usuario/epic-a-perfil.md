# Epic A — Perfil del niño y cuenta del adulto

Historias de la **cuenta del adulto** (**US-16**, **US-19**, **US-20**, **US-21**) y del
**perfil del niño** (**US-01**, **US-02**). Volver al [índice](README.md).

## US-16 — Registro del adulto y consentimiento · Must

Como **padre/tutor** quiero registrarme (nombre, apellidos, parentesco, email) y dar mi
consentimiento para poder crear perfiles de mis hijos cumpliendo la ley.
Ver [cumplimiento-menores.md](../cumplimiento-menores.md).

**Criterios de aceptación**

- Dado que no hay cuenta, Cuando abro la app, Entonces se me pide registrarme como
  adulto antes de poder crear un perfil de niño.
- Dado el alta, Cuando relleno nombre, apellidos, parentesco y email y acepto los
  términos, Entonces se crea el `Guardian` con el consentimiento registrado
  (`consentimientoDado`, `consentimientoEn`, versión).
- Dado un email ya registrado por otra cuenta, Cuando intento darme de alta con él,
  Entonces el registro se rechaza (email único) con un mensaje claro y no se crea un
  `Guardian` duplicado (`RegisterGuardian` → `ConflictError`/409).
- Dado que no acepto el consentimiento, Cuando intento continuar, Entonces no puedo
  crear perfiles de niños.
- Dado un parentesco, Cuando se guarda, Entonces es uno de
  `madre | padre | tutor_legal | abuelo_a | otro`.
- Dada la zona de gestión (configuración/perfiles), Cuando un niño la intenta abrir,
  Entonces queda tras una **puerta parental** (regla de tiendas Kids/Families).

## US-19 — Inicio de sesión del adulto · Should · ✅ Fase 5.5

Como **padre/tutor** quiero iniciar sesión en mi cuenta para acceder a mis perfiles y a
la zona de gestión, también si vuelvo o cambio de dispositivo.
Ver [cumplimiento-menores.md](../cumplimiento-menores.md).

> **Alcance del TFM (decisión 2026-06-12):** el inicio de sesión es una **identificación
> ligera por email, sin contraseña** ni verificación robusta de edad. La autenticación
> fuerte (factor de autenticación, sesión con token) queda **fuera del alcance** y se
> declara como mejora futura. Los criterios reflejan el login ligero implementado.

**Criterios de aceptación**

- Dado un `Guardian` registrado (US-16), Cuando inicio sesión indicando su **email**,
  Entonces recupero mi cuenta y accedo a mis perfiles (`POST /guardians/login` → `200`).
- Dado un email **no registrado**, Cuando intento iniciar sesión, Entonces se rechaza con
  un mensaje claro y se me ofrece crear una cuenta (`NotFoundError` → `404`); un email con
  **formato inválido** se rechaza por validación (`400`).
- Dado el email, Cuando se busca la cuenta, Entonces se **normaliza** (recorte + minúsculas),
  de modo que casa aunque se teclee con mayúsculas o espacios.
- Dado un inicio de sesión correcto, Cuando ocurre, Entonces se registra un `AuditLog`
  con `accion=login` y el `guardianId` como actor.
- Dada la zona de gestión (cuenta / perfiles), Cuando se accede, Entonces queda tras la
  **puerta parental** (componente `ParentalGate`), separada de la zona infantil.
- Dado que cierro sesión, Cuando lo confirmo, Entonces se borra la sesión persistida
  (guardián + perfil activo) y la app vuelve al onboarding.

## US-20 — Editar datos de la cuenta del adulto · Should

Como **padre/tutor** quiero actualizar los datos de mi cuenta para mantenerlos al día.

**Criterios de aceptación**

- Dado un `Guardian` existente, Cuando edito nombre, apellidos, teléfono o parentesco y
  guardo, Entonces los cambios se persisten y se reflejan en la cuenta.
- Dado que cambio el email, Cuando el nuevo email ya está en uso por otra cuenta,
  Entonces se rechaza (email único) con un mensaje claro y no se aplica el cambio.
- Dado un parentesco, Cuando se guarda, Entonces sigue siendo uno de
  `madre | padre | tutor_legal | abuelo_a | otro`.
- Dado un campo obligatorio vacío o un email con formato inválido, Cuando intento
  guardar, Entonces se rechaza y la cuenta no se modifica.
- Dada una edición de la cuenta, Cuando se confirma, Entonces se registra un `AuditLog`
  con `accion=editar`, `entidad=Guardian` y el `entidadId` afectado.
- Dado que la edición vive en la zona de gestión, Cuando se inicia, Entonces queda tras
  la puerta parental (y, con US-19, exige sesión de adulto).

## US-21 — Eliminar la cuenta del adulto y todos sus datos · Should

Como **padre/tutor** quiero eliminar mi cuenta y todos los datos asociados para ejercer
mi derecho de supresión (GDPR). Ver [cumplimiento-menores.md](../cumplimiento-menores.md).

**Criterios de aceptación**

- Dada mi cuenta, Cuando pulso "Eliminar cuenta", Entonces se pide confirmación
  explícita advirtiendo que se borrarán de forma permanente la cuenta y **todos** los
  perfiles de niños y sus datos.
- Dado que confirmo, Cuando se ejecuta, Entonces se eliminan el `Guardian` y, en
  cascada, todos sus `ChildProfile` y los `Story`, `Activity` e `InteractionEvent`
  asociados (derecho de supresión).
- Dado el borrado, Cuando ocurre, Entonces los `AuditLog` del adulto conservan
  trazabilidad pero su `guardianId` queda a `null` (`SetNull`), sin impedir el borrado
  de la cuenta.
- Dado que se elimina la cuenta, Cuando termina, Entonces se cierra cualquier sesión
  activa y el cliente borra su estado local (p. ej. `guardianId` en AsyncStorage).
- Dado que la acción vive en la zona de gestión, Cuando se inicia, Entonces queda tras
  la puerta parental (y, con US-19, exige sesión de adulto).

## US-01 — Crear perfil de niño · Must

Como **padre/tutor** quiero crear el perfil de mi hijo/a (nombre, edad, avatar e
intereses) para que los cuentos y actividades se personalicen.

**Criterios de aceptación**

- Dado un `Guardian` con consentimiento (US-16), Cuando creo un perfil, Entonces el
  `ChildProfile` queda asociado a ese adulto (`guardianId`).
- Dado el formulario de perfil, Cuando relleno nombre, selecciono edad, avatar y al
  menos un interés y pulso "Guardar perfil", Entonces el perfil se persiste y queda
  disponible para generar cuentos.
- Dado que el nombre está vacío, Cuando intento guardar, Entonces se rechaza con un
  mensaje claro y no se crea el perfil.
- Dado un valor de edad fuera del rango permitido, Cuando se construye el perfil,
  Entonces el value-object `Edad` lanza error de dominio (no se crea el perfil).
- Dado un `idioma` no soportado, Cuando se construye el perfil, Entonces el
  value-object `Idioma` lo rechaza; si no se indica, el idioma por defecto es ES.
- (Dominio, Fase 1) Dado el caso de uso `CreateChildProfile`, Cuando recibe un DTO
  válido, Entonces devuelve el perfil creado sin tocar IO real (test con repositorio
  en memoria / mock).

## US-02 — Listar y seleccionar perfiles · Must · ✅ (selección en Fase 5.5)

Como **padre/tutor** quiero ver los perfiles existentes y elegir uno para saber para
quién genero el cuento (soporte multi-niño).

**Criterios de aceptación**

- Dado que existen perfiles, Cuando abro "Ver perfiles" o el selector "¿Para quién es
  el cuento?", Entonces se listan todos los perfiles con su nombre y avatar.
- Dado que no existe ningún perfil, Cuando entro al generador, Entonces se me invita a
  crear uno antes de continuar.
- Dado que selecciono un perfil, Cuando genero un cuento, Entonces se usa ese perfil
  como destino.
