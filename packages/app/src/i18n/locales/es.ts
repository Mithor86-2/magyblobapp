/**
 * Diccionario español (idioma por defecto y de respaldo, US-57).
 *
 * El español es la fuente: estos textos son **idénticos** a los que estaban
 * hardcodeados antes de la i18n, de modo que las pruebas user-centric que
 * consultan por texto siguen verdes. Las claves se agrupan por pantalla/
 * componente. Los vocabularios cerrados del dominio viven bajo `vocab` (los
 * consume `presentation/labels.ts`).
 */
export const es = {
  // Vocabularios cerrados del dominio (id ASCII → etiqueta), antes en labels.ts.
  vocab: {
    tema: {
      animales: 'Animales',
      espacio: 'Espacio',
      magia: 'Magia',
      aventuras: 'Aventuras',
      musica: 'Música',
    },
    estilo: {
      aventura: 'Aventura',
      divertido: 'Divertido',
      educativo: 'Educativo',
    },
    ensenanza: {
      amistad: 'Amistad y compartir',
      emociones: 'Gestionar emociones',
      valentia: 'Valentía',
      honestidad: 'Honestidad y respeto',
    },
    parentesco: {
      madre: 'Madre',
      padre: 'Padre',
      tutor_legal: 'Tutor/a legal',
      abuelo_a: 'Abuelo/a',
      otro: 'Otro',
    },
    idioma: {
      es: 'Español',
      en: 'English',
    },
    categoria: {
      arte: 'Arte',
      musica: 'Música',
      logica: 'Lógica',
    },
    proveedor: {
      mock: 'Simulada',
      local: 'IA local',
      cloud: 'IA en la nube',
      // Targets cloud concretos (US-99): misma etiqueta con la letra del proveedor al final.
      gemini: 'IA en la nube (G)',
      groq: 'IA en la nube (GQ)',
      openrouter: 'IA en la nube (OR)',
      cerebras: 'IA en la nube (CB)',
    },
  },

  // Títulos de cabecera del stack (App.tsx).
  nav: {
    consent: 'Crear cuenta',
    login: 'Iniciar sesión',
    selectProfile: 'Elegir perfil',
    createProfile: 'Crear perfil',
    verifyEmail: 'Verificar email',
    parental: 'Zona de adultos',
    achievements: 'Mis logros',
    storyReader: 'Cuento',
    search: 'Buscar',
  },
  search: {
    placeholder: 'Buscar cuentos y actividades',
    stories: 'Cuentos',
    activities: 'Actividades',
    hint: 'Escribe para buscar en tu biblioteca.',
    empty: 'No hay resultados para «{{q}}».',
    errorLoad: 'No se pudo cargar tu biblioteca.',
  },

  // Pestañas (App.tsx).
  tabs: {
    inicio: 'Inicio',
    actividades: 'Actividades',
    cuentos: 'Cuentos',
    historial: 'Historial',
  },

  common: {
    appName: 'Aprendizaje Mágico',
    createAccount: 'Crear cuenta',
    haveAccount: 'Ya tengo cuenta',
    retry: 'Reintentar',
    ups: 'Ups',
    ok: 'Listo',
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    password: 'Contraseña',
    // Fecha de generación del contenido (US-62); {{fecha}} ya viene localizada.
    generatedOn: 'Creado el {{fecha}}',
    // Aviso de espera larga (US-53, cold-start de Render free).
    slowHint: 'Este proceso está tardando más de lo usual. Espera un momento…',
    slowHintServer: 'La primera vez el servidor puede tardar hasta ~1 minuto en despertar.',
    search: 'Buscar',
    clear: 'Limpiar',
    close: 'Cerrar',
    // Incoherencia de datos de sesión (US-98): el guardián o el perfil ya no existen en la BD.
    dataErrorTitle: 'Error de datos',
    dataErrorMessage:
      'Los datos de tu sesión ya no están disponibles. Se ha cerrado la sesión; vuelve a iniciar sesión para continuar.',
  },

  welcome: {
    subtitle:
      'Cuentos y actividades personalizados para tus peques. Empieza creando tu cuenta o entra si ya tienes una.',
  },

  warmup: {
    deploying: 'Preparando el servidor…',
  },

  dashboard: {
    subtitle:
      'Cuentos y actividades personalizados para tus peques. Pruébalo gratis sin registrarte: hasta {{limite}} cuentos y {{limite}} actividades. Crea una cuenta para guardar el progreso de tu peque y generar cuentos y actividades todos los dias.',
    tryStory: 'Prueba un cuento',
    themes: 'Temas',
    styles: 'Estilos',
    generateStory: 'Generar cuento',
    limitReached: 'Límite alcanzado — crea cuenta',
    storiesUsed: 'Cuentos de prueba: {{usados}}/{{limite}}',
    storyLimit: 'Has usado tus {{limite}} cuentos de prueba. Crea una cuenta para seguir creando.',
    activityLimit:
      'Has usado tus {{limite}} actividades de prueba. Crea una cuenta para seguir creando.',
    creatingStory: 'Creando un cuento mágico…',
    tryActivities: 'Prueba unas actividades',
    generateActivities: 'Generar actividades',
    activitiesUsed: 'Actividades de prueba: {{usadas}}/{{limite}}',
    preparingActivities: 'Preparando actividades…',
    errorStory: 'No se pudo generar el cuento.',
    errorActivities: 'No se pudieron generar las actividades.',
  },

  home: {
    greeting: '¡Hola{{nombre}}!',
    subtitle: 'Vamos a aprender y jugar juntos. Elige un cuento mágico o una actividad para hoy.',
    createStory: 'Crear un cuento',
    seeActivities: 'Ver actividades',
    myAchievements: 'Mis logros',
    search: 'Buscar',
    achievementsSummary: '{{conseguidos}}/{{total}}',
    // Ánimo cuando aún no hay ningún logro conseguido (A4/US-73).
    noAchievementsYet: '¡Lee cuentos y haz actividades para ganar tus primeros trofeos!',
    adultsZone: 'Zona de personas adultas',
  },

  // Logros / recompensas del niño (US-68).
  achievements: {
    title: 'Mis logros',
    subtitle: 'Gana medallas leyendo cuentos y haciendo actividades.',
    summary: '{{desbloqueados}} de {{total}} logros',
    progress: '{{progreso}}/{{meta}}',
    unlocked: '¡Conseguido!',
    empty: 'Aún no hay logros. ¡Empieza a jugar!',
    errorLoad: 'No se pudieron cargar los logros.',
    catCuentos: 'Cuentos',
    catActividades: 'Actividades',
    catRacha: 'Constancia',
    catTemas: 'Explorador',
    goalCuentos_one: 'Leer {{count}} cuento',
    goalCuentos_other: 'Leer {{count}} cuentos',
    goalActividades_one: 'Completar {{count}} actividad',
    goalActividades_other: 'Completar {{count}} actividades',
    goalRacha_one: '{{count}} día seguido',
    goalRacha_other: '{{count}} días seguidos',
    goalTema: 'Explorar {{tema}}',
  },

  login: {
    body: 'Escribe el email y la contraseña con los que creaste tu cuenta. Te llevaremos a tus perfiles.',
    passwordPlaceholder: 'Tu contraseña',
    submit: 'Entrar',
    noAccount: '¿No tienes cuenta? Crear una',
    createAccountA11y: 'Crear una cuenta',
    failTitle: 'No pudimos iniciar sesión',
    failMessage: 'El email o la contraseña no son correctos. Revísalos e inténtalo de nuevo.',
    errorGeneric: 'No se pudo iniciar sesión.',
  },

  consent: {
    gateIntro:
      'Para crear la cuenta, resuelve esta operación. Así nos aseguramos de que hay una persona adulta configurando la app.',
    title: 'Crea tu cuenta',
    body: 'Eres la persona responsable del menor. Necesitamos tus datos para asociar los perfiles y registrar tu consentimiento.',
    nombre: 'Nombre',
    apellidos: 'Apellidos',
    passwordPlaceholder: 'Crea una contraseña',
    passwordHint: 'Mínimo {{min}} caracteres, con al menos una letra y un número.',
    parentesco: 'Parentesco',
    accept: 'Acepto',
    consentText:
      'Doy mi consentimiento para tratar los datos del menor con la única finalidad de generar cuentos y actividades. Los datos no se comparten con terceros y el contenido se genera en local. (Versión {{version}})',
    submit: 'Aceptar y continuar',
    creating: 'Creando tu cuenta…',
    errorGeneric: 'No se pudo completar el registro.',
  },

  // Verificación de email por OTP (US-93).
  verify: {
    title: 'Verifica tu email',
    body: 'Te hemos enviado un código de 6 dígitos a {{email}}. Escríbelo aquí para activar tu cuenta.',
    codeLabel: 'Código de verificación',
    codePlaceholder: '000000',
    submit: 'Verificar',
    resend: 'Reenviar código',
    resendCooldown: 'Puedes reenviar en {{segundos}} s',
    resentOk: 'Te hemos enviado un código nuevo.',
    errorCode: 'El código no es correcto o ha caducado. Revísalo o pide uno nuevo.',
    errorTooMany: 'Demasiados intentos. Pide un código nuevo.',
    errorResend: 'No se pudo reenviar el código. Inténtalo de nuevo.',
    errorGeneric: 'No se pudo verificar el email.',
  },

  createProfile: {
    name: '¿Cómo se llama tu peque?',
    namePlaceholder: 'Nombre del peque',
    age: '¿Cuántos años tiene tu peque?',
    language: 'Idioma',
    avatar: 'Elige tu avatar de tu peque',
    interests: '¿Qué le gusta a tu peque?',
    submit: '¡Listo!',
    creating: 'Creando el perfil…',
    errorGeneric: 'No se pudo crear el perfil.',
  },

  selectProfile: {
    title: '¿Quién va a jugar?',
    subtitle: 'Elige un perfil para continuar.',
    loading: 'Cargando perfiles…',
    empty: 'Aún no tienes perfiles. Crea el primero para empezar.',
    createNew: 'Crear nuevo perfil',
    chooseA11y: 'Elegir a {{nombre}}',
    years: '{{edad}} años',
    errorLoad: 'No se pudieron cargar los perfiles.',
  },

  activities: {
    title: 'Actividades para hoy',
    subtitle: '¡Es hora de jugar y aprender, {{nombre}}!',
    pequeFallback: 'peque',
    category: 'Categoría',
    all: 'Todas',
    preparing: 'Preparando actividades…',
    retryHint: 'Toca «Generar actividades» para reintentar.',
    emptyNew: 'No hay actividades nuevas. Prueba otra categoría.',
    generateMore: 'Generar más',
    generate: 'Generar actividades',
    errorGenerate: 'No se pudieron generar las actividades.',
    errorRating: 'No se pudo guardar la valoración.',
  },

  storyGenerator: {
    title: 'Un cuento para {{nombre}}',
    youFallback: 'ti',
    themes: 'Temas',
    styles: 'Estilos',
    teaching: '¿Qué quieres enseñar?',
    teachingHint: 'Opcional: elige un valor para la moraleja.',
    nameField: '¿Usar el nombre?',
    useName: 'Usar el nombre de {{nombre}}',
    creating: 'Creando un cuento mágico…',
    retryHint: 'Toca «Generar cuento» para reintentar.',
    generateAnother: 'Generar otro',
    generate: 'Generar cuento',
    needThemeStyle: 'Elige al menos un tema y un estilo.',
    errorGenerate: 'No se pudo generar el cuento.',
  },

  reader: {
    markRead: 'Marcar como leído',
    alreadyRead: 'Leído',
    // Lectura paginada como libro (A2/US-73).
    page: 'Página {{n}} de {{total}}',
    prevPage: 'Página anterior',
    nextPage: 'Página siguiente',
    // Continuar la historia (US-78).
    continueStory: 'Continuar la historia',
    continueError: 'No se pudo continuar la historia.',
    // Última página del libro (US-83, ajuste #5).
    end: '⭐ ¡Fin de la historia! ⭐',
    // Modal al llegar a la última página (US-27).
    markReadPromptTitle: '¿Marcar como leído?',
    markReadPromptBody: 'Has llegado al final del cuento. ¿Quieres marcarlo como leído?',
    markReadPromptConfirm: 'Sí, marcar',
    markReadPromptCancel: 'Ahora no',
    // Puerta de sesión en el lector anónimo (US-96).
    signInRequiredTitle: 'Inicia sesión para continuar',
    signInRequiredBody:
      'Para escuchar el cuento, marcarlo como leído o guardarlo necesitas una cuenta. ¡Es gratis!',
    signInRequiredConfirm: 'Crear cuenta',
    signInRequiredCancel: 'Ahora no',
  },

  history: {
    title: 'Tu historial',
    subtitle: 'Mira todo lo que has aprendido y creado.',
    sectionStories: 'Cuentos mágicos',
    emptyStories: 'Aún no hay cuentos. ¡Crea el primero!',
    sectionActivities: 'Actividades hechas',
    emptyActivities: 'Todavía no has completado actividades.',
    read: 'Leído',
    new: 'Nuevo',
    readStory: 'Leer cuento',
    readStoryA11y: 'Leer el cuento {{titulo}}',
    errorLoad: 'No se pudo cargar el historial.',
    // Filtros del historial (US-62).
    filterTheme: 'Tema',
    filterStyle: 'Estilo',
    filterTeaching: 'Enseñanza',
    filterCategory: 'Categoría',
    filterAll: 'Todos',
    filtersTitle: 'Filtros',
    searchWithCount: 'Buscar ({{count}})',
    filters: 'Filtros',
    filtersWithCount: 'Filtros ({{count}})',
    applyFilters: 'Aplicar',
    noMatchStories: 'Ningún cuento coincide con el filtro.',
    noMatchActivities: 'Ninguna actividad coincide con el filtro.',
    // Favoritos y búsqueda (US-64).
    searchLabel: 'Buscar',
    searchPlaceholder: 'Busca por título, tema, categoría…',
    onlyFavorites: 'Solo favoritos',
    // Destacados + pestañas (A3/US-74).
    latest: 'Lo último',
    lastStory: 'Último cuento',
    lastActivity: 'Última actividad',
    tabStories: 'Cuentos',
    tabActivities: 'Actividades',
  },

  favorite: {
    add: 'Marcar como favorito',
    remove: 'Quitar de favoritos',
  },

  parental: {
    gateIntro:
      'Esta es la zona de personas adultas. Resuelve la operación para gestionar la cuenta.',
    account: 'Cuenta',
    language: 'Idioma de la app',
    theme: 'Tema de la app',
    themeSystem: 'Automático',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    changeProfile: 'Cambiar de perfil',
    logout: 'Cerrar sesión',
    logoutConfirmTitle: 'Cerrar sesión',
    logoutConfirmMessage: '¿Seguro que quieres cerrar la sesión de esta cuenta?',
    sentryTest: 'Probar Sentry (dev)',
    sentryTitle: 'Sentry',
    sentrySent: 'Evento de prueba enviado. Revisa el dashboard de Sentry (Issues).',
    sentryInactive: 'Sentry no está activo (sin DSN): el evento no se ha enviado.',
  },

  activityCard: {
    minutes: '{{min}} min',
    level: 'Nivel {{nivel}}',
    howTo: 'Cómo hacerlo',
    showSteps: 'Ver pasos',
    hideSteps: 'Ocultar pasos',
    showMore: 'Ver más',
    showLess: 'Ver menos',
    done: '¡Hecha!',
    howWasIt: '¿Qué tal estuvo?',
    markDone: 'Realizado',
  },

  authorBadge: {
    author: 'Autor: {{proveedor}}',
  },

  narration: {
    idle: 'Escuchar',
    loading: 'Preparando…',
    playing: 'Pausar',
    paused: 'Reanudar',
    stop: 'Parar',
  },

  parentalGate: {
    title: 'Zona de personas adultas',
    bodyDefault:
      'Para continuar, resuelve esta operación. Así nos aseguramos de que hay una persona adulta.',
    question: '{{a}} + {{b}} = ?',
    wrongTitle: 'Casi',
    wrongMessage: 'Esa no es. Prueba con otra operación.',
  },

  errorFallback: {
    title: '¡Vaya! Algo se ha despistado',
    body: 'No pasa nada. Vamos a intentarlo otra vez.',
    retry: 'Reintentar',
  },
};
