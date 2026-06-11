# Diseño del MVP — "Aprendizaje Mágico"

Export de [Stitch](https://stitch.withgoogle.com/) en
[stitch_magyblob/](stitch_magyblob/): 6 pantallas (`screen.png` + `code.html` por
pantalla) y un design system en
[stitch_magyblob/aprendizaje_m_gico/DESIGN.md](stitch_magyblob/aprendizaje_m_gico/DESIGN.md).

Es la **fuente de verdad de la UI**. El `code.html` es una maqueta (Tailwind CDN +
Material Symbols), no código de producción: sirve de referencia visual y de tokens,
no se copia tal cual a la app Expo (Fase 4).

> Nota de alcance: el diseño muestra la app **completa** (6 pantallas). El proyecto
> sigue siendo _vertical slice primero_ (ver [../plan-ejecucion-master.md](../plan-ejecucion-master.md)):
> solo Crear perfil + Generador entran en el HITO 1. Las demás pantallas son Fase 5+.

## Pantallas → fases

| Pantalla             | Carpeta                            | Fase |
| -------------------- | ---------------------------------- | ---- |
| Crear perfil         | `crear_perfil_aprendizaje_m_gico`  | 4 ★  |
| Generador de cuentos | `generador_de_cuentos_...`         | 4 ★  |
| Inicio               | `inicio_aprendizaje_m_gico`        | 4/5  |
| Actividades          | `actividades_aprendizaje_m_gico`   | 5    |
| Historial            | `historial_aprendizaje_m_gico`     | 5    |
| Configuración        | `configuraci_n_aprendizaje_m_gico` | 5/6  |

★ = parte del slice vertical (HITO 1).

## Modelo de datos derivado del diseño

Esto es lo que las pantallas obligan a tener en el dominio. Value-objects **solo**
para `edad` e `idioma` (regla del plan); el resto son escalares simples (YAGNI).

> **Vocabulario de temática (unificado):** `animales | espacio | magia | aventuras |
música`. Lo comparten los `intereses` del perfil y el `tema` del cuento; los
> intereses pre-seleccionan el tema. (El diseño mostraba dos listas distintas; se
> unificaron — ver decisión I-2 en [../historias-usuario.md](../historias-usuario.md).)

### ChildProfile (pantalla _Crear perfil_)

- `nombre` — texto libre ("¿Cómo te llamas?").
- `edad` — 2 a 6 (selector). **Value-object** (rango válido). El brand de `DESIGN.md`
  dice 2-5, pero la UI y el VO usan 2-6 (decisión I-5).
- `idioma` — ES por defecto ("Español (Latinoamérica)"), bilingüe ES/EN. **Value-object**.
- `avatar` — id de un avatar predefinido (~8 opciones).
- `intereses[]` — multi-selección del vocabulario de temática. Pre-selecciona el tema.

### Story (pantalla _Generador de cuentos_)

- Entrada: `perfil` destino + `tema` (del vocabulario unificado) +
  `estilo` (`aventura | divertido | educativo`).
- Salida: `título` + `cuerpo`, **en el idioma del perfil** (decisión I-4).
- Metadatos (Historial): `fecha`, estado `nuevo | leído`, marcable (bookmark).
- Precisa la firma de `AIProvider.generateStory({ perfil, tema, estilo })` (Fase 2).

### Activity (pantalla _Actividades_)

- **Generadas con IA** por perfil (decisión I-3), no es un catálogo fijo; el diseño
  ilustra la presentación. `recommendActivities` las produce vía `AIProvider`.
- `categoría` (`arte | música | lógica`) — borde de color por categoría.
- `título`, `descripción`, `duración`, `nivel`.
- Progreso (Historial): `completadaEn` (fecha) + valoración en estrellas, como estado
  de la actividad (sin entidad de progreso aparte).

## Design system (resumen)

Detalle completo en `DESIGN.md`. Para Fase 4:

- **Tipografía:** Quicksand en todo (rounded, dyslexic-friendly). Tamaños grandes.
- **Paleta:** "pasteles saturados" — Primary coral `#9c4143`, Secondary menta
  `#426561`, Tertiary cielo `#0d6683`, surface crema `#fff8f6`, texto cocoa `#221a16`.
- **Forma:** botones tipo píldora "squishy" (borde inferior 3-4px), tarjetas radio ≥24px.
- **Accesibilidad:** tap targets ≥ 64×64px, márgenes seguros de 24px, modo nocturno.
- **Navegación inferior:** 4 tabs (Inicio · Actividades · Cuentos · Historial) con
  "blob" pastel detrás del icono activo (legible para no-lectores).
