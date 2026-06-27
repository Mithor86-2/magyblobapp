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
    },
  },

  // Títulos de cabecera del stack (App.tsx).
  nav: {
    consent: 'Crear cuenta',
    login: 'Iniciar sesión',
    selectProfile: 'Elegir perfil',
    createProfile: 'Crear perfil',
    parental: 'Zona de adultos',
    storyReader: 'Cuento',
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
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    password: 'Contraseña',
  },

  welcome: {
    subtitle:
      'Cuentos y actividades personalizados para tus peques. Empieza creando tu cuenta o entra si ya tienes una.',
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
    adultsZone: 'Zona de personas adultas',
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
    errorGeneric: 'No se pudo completar el registro.',
  },

  createProfile: {
    name: '¿Cómo te llamas?',
    namePlaceholder: 'Tu nombre',
    age: '¿Cuántos años tienes?',
    language: 'Idioma',
    avatar: 'Elige tu avatar',
    interests: '¿Qué te gusta?',
    submit: '¡Listo!',
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
    creating: 'Creando un cuento mágico…',
    retryHint: 'Toca «Generar cuento» para reintentar.',
    generateAnother: 'Generar otro',
    generate: 'Generar cuento',
    needThemeStyle: 'Elige al menos un tema y un estilo.',
    errorGenerate: 'No se pudo generar el cuento.',
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
  },

  parental: {
    gateIntro:
      'Esta es la zona de personas adultas. Resuelve la operación para gestionar la cuenta.',
    account: 'Cuenta',
    language: 'Idioma de la app',
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
