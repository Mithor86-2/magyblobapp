# Epic A — Perfil del niño y cuenta del adulto

Historias de la **cuenta del adulto** (**US-16**, **US-19**, **US-20**, **US-21**, **US-48**) y del
**perfil del niño** (**US-01**, **US-02**, **US-49**, **US-103**, **US-104**). Volver al [índice](README.md).

## US-16 — Registro del adulto y consentimiento · Must

Como **padre/tutor** quiero registrarme (nombre, apellidos, parentesco, email) y dar mi
consentimiento para poder crear perfiles de mis hijos cumpliendo la ley.
Ver [cumplimiento-menores.md](../cumplimiento-menores.md).

> **Ampliada por [US-48](#us-48):** el alta también define una **contraseña** que se guarda
> hasheada (revierte la postura "sin contraseña").

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

> **Alcance del TFM (decisión 2026-06-12, revisada el 2026-06-26):** el login era una
> **identificación ligera por email, sin contraseña**. **[US-48](#us-48) revierte esa
> postura**: el login ahora **verifica contraseña** contra el `passwordHash` del `Guardian`.
> La verificación robusta de edad sigue fuera del alcance. Los criterios de abajo reflejan el
> login ligero original; los de US-48 los amplían con la comprobación de contraseña.

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

## US-48 — Contraseña en el alta y login real · Should · Mejoras

Como **padre/tutor** quiero proteger mi cuenta con una **contraseña** para que el inicio
de sesión verifique mi identidad de verdad y nadie pueda entrar solo con conocer mi email.
Ver [cumplimiento-menores.md](../cumplimiento-menores.md).

> **Cambio de postura (decisión 2026-06-26):** esta historia **revierte** la decisión
> declarada de _"identificación ligera por email, sin contraseña"_ (Fase 5.5, criterio C-10
> de [cumplimiento-menores.md](../cumplimiento-menores.md) y el alcance de **US-19**). El alta
> ahora guarda un **hash de la contraseña** (bcrypt/argon2, nunca en claro) y el login
> **verifica la contraseña**, dejando de ser una identificación ligera por email. Amplía
> **US-16** (alta) y **US-19** (login); toca el caso de uso `LoginGuardian`, la pantalla
> `LoginScreen` y, en el alta, `RegisterGuardian` / `ConsentScreen`.

**Criterios de aceptación**

- Dado el alta del adulto (US-16), Cuando relleno los datos y **defino una contraseña**,
  Entonces el `Guardian` se crea con el `passwordHash` derivado (bcrypt/argon2) y **nunca**
  se persiste ni se devuelve la contraseña en claro.
- Dada una contraseña que no cumple el mínimo de robustez (longitud mínima), Cuando intento
  darme de alta, Entonces se rechaza por validación con un mensaje claro y no se crea el
  `Guardian` (`400`).
- Dado un `Guardian` registrado con contraseña, Cuando inicio sesión con su **email y la
  contraseña correcta**, Entonces recupero mi cuenta y accedo a mis perfiles
  (`POST /guardians/login` → `200`).
- Dado un email registrado, Cuando inicio sesión con la **contraseña incorrecta**, Entonces
  se rechaza con un mensaje genérico que **no distingue** entre email inexistente y
  contraseña errónea (para no filtrar qué emails existen) y no se inicia sesión (`401`).
- Dado un email **no registrado**, Cuando intento iniciar sesión, Entonces se rechaza con el
  mismo `401` genérico; un email con **formato inválido** se rechaza por validación (`400`).
- Dado el email, Cuando se busca la cuenta, Entonces se **normaliza** (recorte + minúsculas),
  de modo que casa aunque se teclee con mayúsculas o espacios.
- Dado un inicio de sesión correcto, Cuando ocurre, Entonces se registra un `AuditLog` con
  `accion=login` y el `guardianId` como actor; **no** se registra la contraseña en ningún log.
- (Dominio/Aplicación) Dado el caso de uso `LoginGuardian`, Cuando recibe email + contraseña,
  Entonces compara contra el `passwordHash` mediante el `PasswordHasher` (puerto) sin tocar IO
  real en el test (repositorio en memoria + hasher de prueba).

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

## US-49 — Selección de perfil al arrancar · Should · Mejoras

Como **padre/tutor** con varios hijos quiero que, al abrir la app con la sesión ya
iniciada pero sin un perfil activo, se me lleve a elegir perfil cuando tengo más de uno,
y se entre directo cuando solo tengo uno, para no tener que reseleccionar de más.

Amplía [US-02](#us-02): US-02 cubre **listar y elegir** un perfil; US-49 añade la
**lógica de arranque** que decide a qué pantalla ir según cuántos perfiles tiene el
guardián (reaprovecha la pantalla `SelectProfileScreen` ya existente).

**Criterios de aceptación**

- Dado un guardián con sesión iniciada y **sin perfil activo**, Cuando abro la app y
  tiene **más de un** perfil creado, Entonces la app abre la pantalla de **selección de
  perfil** (`SelectProfile`) para que elija para quién jugar.
- Dado un guardián con sesión iniciada y **sin perfil activo**, Cuando abro la app y
  tiene **exactamente un** perfil, Entonces ese perfil se **auto-selecciona** como perfil
  activo y la app entra directa a las pestañas (`Main`), sin pasar por la selección.
- Dado un guardián con sesión iniciada que **ya tiene un perfil activo** persistido,
  Cuando abro la app, Entonces se entra directo a `Main` con ese perfil (comportamiento
  previo, sin cambios).
- Dado un guardián **sin ningún** perfil creado, Cuando abro la app, Entonces se mantiene
  el flujo de selección/creación existente (la pantalla de selección invita a crear el
  primero), sin error.
- Dado que **no hay sesión** (sin guardián), Cuando abro la app, Entonces se va al
  onboarding (`Welcome`), igual que hasta ahora.
- (Estado) Dado el store, Cuando se cargan los perfiles del guardián, Entonces quedan
  disponibles en `profiles` (vía `setProfiles`) para que la lógica de arranque pueda
  contar cuántos hay; los perfiles se persisten junto al resto de la sesión.

## US-103 — Avatares con imagen · Should · Mejoras

Como **niño/a** quiero elegir mi avatar entre **imágenes** bonitas (no emojis) para
personalizar mi perfil. Amplía la selección de avatar de [US-01](#us-01): el `avatar`
que se guarda en el perfil sigue siendo un `id` de texto; solo cambia la **presentación**
(imagen en vez de emoji).

**Criterios de aceptación**

- Dado el selector de avatar (al crear perfil), Cuando lo abro, Entonces veo un set de
  **imágenes propias** (12 animales) empaquetadas en la app, y al elegir una se guarda su
  `id` en el perfil (mismo contrato que antes; el backend no cambia).
- Dado un perfil con avatar, Cuando aparece en cualquier pantalla (Inicio, elegir perfil,
  generador de cuentos, loader a pantalla completa), Entonces se muestra su **imagen**.
- Dado un perfil antiguo cuyo `avatar` es un id sin imagen (p. ej. un emoji previo como
  `gato`/`unicornio`), Cuando se muestra, Entonces cae a un **avatar por defecto** sin
  error.
- (Cumplimiento) Dado que las imágenes se **empaquetan en build-time**, Cuando se usan,
  Entonces **no hay descargas en runtime** ni SDK de terceros (C-2/C-5). Las imágenes se
  **optimizan** (256×256) para no inflar el bundle.

## US-104 — Selector de avatar en rejilla a ancho completo, sin fondo · Should · Mejoras

Como **niño/a** quiero ver los avatares **grandes y ordenados** al crear mi perfil para
elegir mejor. Ajuste visual que amplía [US-103](#us-103); no cambia el `avatar` guardado.

**Criterios de aceptación**

- Dado el selector de avatar (al crear perfil), Cuando lo veo, Entonces los 12 avatares se
  disponen en **3 filas de 4** y cada imagen **ocupa 1/4 del ancho** del contenedor (llenan
  el ancho, más grandes que antes).
- Dado un avatar en el selector, Cuando se muestra, Entonces **no** tiene recuadro de fondo
  de color detrás; solo se ve la imagen (con transparencia).
- Dado que elijo un avatar, Cuando queda seleccionado, Entonces se marca con un **anillo**
  del color primario (sin fondo), y el resto no muestra anillo; elegir otro no desplaza el
  layout.
