# Plan de coordinación — Lote de mejoras nº 2 (UX, contenido, despliegue)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md); protocolo de paralelismo en [../trabajo-en-paralelo.md](../trabajo-en-paralelo.md).
>
> Coordinación del lote (DAG, conflictos, olas). El **cómo** detallado de cada feature lo escribe
> `abrir-feature` en su `Docs/planes/<branch>.md` al abrir el worktree.

## Objetivo

Ejecutar las 8 mejoras pedidas (lista en `ideas.txt`) con el **máximo paralelismo seguro**. Tras mapear
el código (4 exploradores), el paralelismo real está **acotado**: i18n (8) y cabeceras (2) reescriben
los mismos ficheros de pantalla, y títulos (4) + instrucciones (5) + portadas (7) comparten el pipeline
de IA (`prompts.ts`, `MockProvider`) y el esquema Prisma. Por eso hay **una ola paralela (4 features)** y
una cola en su mayoría **secuencial**.

## Mejoras → features

| Ref | Feature (mejoras que cubre)                                                                                | US    | Rama                                            | Capa          | Depende de            |
| --- | ---------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------- | ------------- | --------------------- |
| F1  | Robustez prod + alta/login (1 timeout, 1.2 teclado, 1.3 email único, 1.4 contraseña)                       | US-53 | `feature/57-robustez-alta-login`                | app + backend | —                     |
| F2  | Contenido IA: títulos variados + instrucciones de actividad + temas del generador (4, 5, fix magia/música) | US-54 | `feature/58-contenido-ia-titulos-instrucciones` | backend + app | —                     |
| F3  | Voz ES/EN de la narración (3)                                                                              | US-55 | `feature/59-voz-es-en`                          | backend       | —                     |
| F4  | Estándares de diseño Android/iOS (6)                                                                       | US-56 | `feature/60-estandares-diseno`                  | app           | —                     |
| F5  | i18n del app ES/EN (8)                                                                                     | US-57 | `feature/61-i18n-app`                           | app           | F1 (forms)            |
| F6  | Cabeceras por pantalla (2)                                                                                 | US-58 | `feature/62-cabeceras-pantalla`                 | app           | F1 (Screen.tsx)       |
| F7  | Portadas de imagen de cuentos/actividades (7)                                                              | US-59 | `feature/63-portadas-imagen`                    | backend + app | F2, F6 + **decisión** |

> US nuevas desde **US-53**; ramas desde **feature/57**. `abrir-feature` confirma al abrir.

## Orden de ejecución (DAG)

```
OLA 1 — 4 features en paralelo (sin solaparse en ficheros):
  F1  robustez (http.ts, Screen.tsx, Consent/Login, guardians.ts)
  F2  contenido IA (prompts.ts, MockProvider, Activity, schema+migración, ActivityCard)
  F3  voz ES/EN (config.ts, ElevenLabsProvider, .env)
  F4  diseño (tokens.ts, BubblyButton, ripple/haptics)

COLA SECUENCIAL (tras la Ola 1; comparten ficheros de pantalla / IA):
  F6  cabeceras  ──▶  F5  i18n  ──▶  F7  portadas de imagen
  (F6 y F5 reescriben TODAS las pantallas → no pueden ir a la vez;
   F7 toca StoryReader/ActivityCard + Activity/schema → tras F2 y F6)
```

## Mapa de conflictos (por qué este orden)

| Fichero                                                                   | Features que lo tocan                                                  | Mitigación                                                                |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `infrastructure/ai/prompts.ts` + `MockProvider.ts`                        | F2 (4 y 5), F7 (7)                                                     | **4 y 5 combinadas en F2**; F7 va después                                 |
| `prisma/schema.prisma` (migración)                                        | F2 (`Activity.instrucciones`), F7 (`Story.portada`, `Activity.imagen`) | Migraciones **secuenciales**: solo F2 migra en la Ola 1; F7 migra después |
| `domain/entities/Activity.ts`, `dto.ts`, `mappers.ts`, `ActivityCard.tsx` | F2, F7                                                                 | F7 tras F2                                                                |
| `components/Screen.tsx`                                                   | F1 (KeyboardAvoidingView), F6 (header)                                 | F6 tras F1                                                                |
| **Todas** las `presentation/screens/*`                                    | F6 (header por pantalla), F5 (extrae strings)                          | **F6 → F5 secuencial** (ambas reescriben cada pantalla)                   |
| `ConsentScreen`/`LoginScreen`                                             | F1 (forms), F5 (i18n)                                                  | F5 tras F1                                                                |
| `presentation/store/useAppStore.ts`                                       | F5 (`appLanguage`)                                                     | solo F5                                                                   |

## Decisiones pendientes (resolver antes de abrir esas features)

- **F7 / item 7 (portadas) — DECIDIDO:** **modelo = Gemini/Imagen** (reutiliza `GEMINI_API_KEY` ya
  presente y el target `gemini` del `CloudProvider`; ~$0.01-0.02/img y free tier para la demo). Generación
  **asíncrona** (crear el cuento ya; la portada llega después) para no chocar con los timeouts de F1.
  **Respaldo por tema/estilo:** imágenes locales en `packages/app/assets/images/story/` (ya creadas:
  `animales.png`, `espacio.png`, `magia.png`, `aventura.png`, `divertido.png`); **faltan**
  `aventuras.png`, `musica.png`, `educativo.png`. Si la generación falla o no hay clave, se muestra el
  respaldo elegido por **tema** (y si no, por **estilo**, y si no, un `default`). Pendiente menor de
  decidir: **almacenamiento** de la imagen generada (data URL en BD vs bucket R2/Supabase) — recomendado
  empezar por URL/base64 y migrar a bucket si crece. **Cumplimiento:** generar en Gemini envía el
  prompt (tema/estilo/título, **sin nombre del niño**) a un tercero → desviación a documentar (C-5);
  sin clave, cae al respaldo local (privacidad por diseño, sin red).
- **F5 / item 8 (i18n):** librería — recomendado **`i18next` + `react-i18next` + `expo-localization`**
  (detecta idioma del dispositivo); ~100-150 strings a extraer; `appLanguage` (ES/EN) en `useAppStore` con
  selector en la zona de adultos (distinto del idioma del PERFIL, que ya existe para los cuentos).
- **F1 / item 1.4 (contraseña):** ¿reglas de complejidad (mayús+minús+número) o mantener solo `min 8`
  (postura NIST actual)? Por defecto: añadir un mínimo razonable (≥8 con al menos letra y número) + ayuda
  visual; sin reglas agresivas.
- **F2 / item 5 (instrucciones):** campo nuevo `Activity.instrucciones` (migración) — recomendado, frente a
  reaprovechar `descripcion`. El botón "Realizado" pasa a color propio (token de acento) en `ActivityCard`.
- **F3 / item 3 (voz):** hoy usa voces premade por idioma (env vacías). Decidir si fijar `voice_id` ES/EN
  concretos (de la cuenta ElevenLabs) o dejar premade; opcional endpoint para listar voces.

## Notas técnicas por feature

- **F1 (robustez):** subir timeouts de la app (`infrastructure/http.ts` `DEFAULT 15→30`, `GENERATION
30→90`; `useNarration` `15→30`), **reintento con backoff** ante `timeout`/`network`, y **ping de
  warm-up** a `/health` al arrancar (`composition.ts`) para el cold start de Render. `KeyboardAvoidingView`
  en `Screen.tsx`. Zod `email()` en `routes/guardians.ts` (el 409 por email duplicado **ya funciona**).
  Reglas de contraseña en `guardians.ts` + `ConsentScreen`.
- **F2 (contenido):** el prompt (`prompts.ts`) pide **variar el título** y `MockProvider` deja de usar el
  título fijo. Campo `instrucciones` en `Activity` (+ entidad, `parseResponse`, dto, mapper, schema +
  migración) con prompt "paso a paso"; `ActivityCard` los muestra y el botón "Realizado" cambia de color.
  **Fix lista de temas del generador** (`StoryGeneratorScreen`): hoy `temasDisponibles` se limita a
  `profile.intereses` (faltan **magia** y **música**); debe ofrecer **todos** los temas
  (`animales·espacio·magia·aventuras·música`) con los intereses del perfil pre-seleccionados.
- **F3 (voz):** rellenar/documentar `ELEVENLABS_VOICE_ID_ES/_EN` (config ya resuelve `voiceIdByLang`);
  fallback a voz nativa (`expo-speech`) intacto. Opcional `GET /settings/tts/voices`.
- **F4 (diseño):** ripple táctil (Android) y `expo-haptics` en botones; revisar contraste AA; etiquetas de
  "atrás" en iOS; mensajes de error menos genéricos. Sobre `theme/tokens.ts` y componentes
  (`BubblyButton`), sin tocar el contenido de las pantallas (para no chocar con F5/F6).
- **F5 (i18n):** `i18next`; diccionarios ES/EN; extraer strings de `presentation/screens/*` y headers de
  `App.tsx`; `labels.ts` (enums) ya centralizado se integra; `appLanguage` en store; selector en zona de
  adultos.
- **F6 (cabeceras):** variante `Screen` con `headerImageName` que pinta la imagen de
  `assets/images/headers/` (hay `welcome/home/dashboard/cuentos/actividades.png`); cada pantalla pasa su
  nombre. Validar ritmo vertical/safe-area.
- **F7 (portadas):** método `generateImage` en `AIProvider` + adaptador **Gemini/Imagen** (prompt a partir
  de tema/estilo/título, **sin nombre del niño**); `Story.portada` / `Activity.imagen` (migración) + UI
  (`StoryReaderScreen`, `ActivityCard`). Generación **asíncrona**. **Respaldo local por nombre** en
  `packages/app/assets/images/story/` mapeado por **tema** (`animales|espacio|magia|aventuras|musica`) y
  **estilo** (`aventura|divertido|educativo`), con un `default`; selección por nombre (como las cabeceras
  de F6), sin lógica extra. Optimizar el peso de los respaldos (~750 KB → ~150-250 KB) antes de empaquetar.
  Prompts de generación de los respaldos: ver el chat (bloque de estilo constante + sujeto por tema).

## Definition of Done (cada feature)

- `pnpm check` verde tras cada fase; tests co-localizados donde aplique.
- US-NN creada/actualizada + trazabilidad en `historias-usuario/README.md`.
- `cumplimiento-menores.md` actualizado donde toque (F7 imágenes; F3 ya documentado para ElevenLabs).
- Pruebas con el usuario antes del cierre; `finish`/merge solo tras confirmación explícita.
