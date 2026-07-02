/**
 * English dictionary (US-57). Mirrors the key structure of `es.ts`. Spanish is
 * the source/fallback language; this file provides the English translations the
 * adult can switch to from the parental zone. The closed domain vocabularies
 * (`vocab`) keep the same identifiers; only their human label is translated.
 */
import type { es } from './es';

// Same shape as the Spanish dictionary so missing keys fail at compile time.
export const en: typeof es = {
  vocab: {
    tema: {
      animales: 'Animals',
      espacio: 'Space',
      magia: 'Magic',
      aventuras: 'Adventures',
      musica: 'Music',
    },
    estilo: {
      aventura: 'Adventure',
      divertido: 'Fun',
      educativo: 'Educational',
    },
    ensenanza: {
      amistad: 'Friendship & sharing',
      emociones: 'Managing emotions',
      valentia: 'Bravery',
      honestidad: 'Honesty & respect',
    },
    parentesco: {
      madre: 'Mother',
      padre: 'Father',
      tutor_legal: 'Legal guardian',
      abuelo_a: 'Grandparent',
      otro: 'Other',
    },
    idioma: {
      es: 'Spanish',
      en: 'English',
    },
    categoria: {
      arte: 'Art',
      musica: 'Music',
      logica: 'Logic',
    },
    proveedor: {
      mock: 'Simulated',
      local: 'Local AI',
      cloud: 'Cloud AI',
    },
  },

  nav: {
    consent: 'Create account',
    login: 'Log in',
    selectProfile: 'Choose profile',
    createProfile: 'Create profile',
    parental: 'Adults zone',
    achievements: 'My achievements',
    storyReader: 'Story',
  },

  tabs: {
    inicio: 'Home',
    actividades: 'Activities',
    cuentos: 'Stories',
    historial: 'History',
  },

  common: {
    appName: 'Magical Learning',
    createAccount: 'Create account',
    haveAccount: 'I already have an account',
    retry: 'Try again',
    ups: 'Oops',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    password: 'Password',
    // Content generation date (US-62); {{fecha}} is already localized.
    generatedOn: 'Created on {{fecha}}',
    // Long-wait notice (US-53, Render free cold start).
    slowHint: 'This is taking longer than usual. Please wait a moment…',
    slowHintServer: 'The first time, the server may take up to ~1 minute to wake up.',
    search: 'Search',
    clear: 'Clear',
    close: 'Close',
  },

  welcome: {
    subtitle:
      'Personalized stories and activities for your little ones. Start by creating your account or log in if you already have one.',
  },

  dashboard: {
    subtitle:
      'Personalized stories and activities for your little ones. Try it free without signing up: up to {{limite}} stories and {{limite}} activities. Create an account to save your child’s progress and generate stories and activities every day.',
    tryStory: 'Try a story',
    themes: 'Themes',
    styles: 'Styles',
    generateStory: 'Generate story',
    limitReached: 'Limit reached — create an account',
    storiesUsed: 'Trial stories: {{usados}}/{{limite}}',
    storyLimit: 'You have used your {{limite}} trial stories. Create an account to keep creating.',
    activityLimit:
      'You have used your {{limite}} trial activities. Create an account to keep creating.',
    creatingStory: 'Creating a magical story…',
    tryActivities: 'Try some activities',
    generateActivities: 'Generate activities',
    activitiesUsed: 'Trial activities: {{usadas}}/{{limite}}',
    preparingActivities: 'Preparing activities…',
    errorStory: 'Could not generate the story.',
    errorActivities: 'Could not generate the activities.',
  },

  home: {
    greeting: 'Hi{{nombre}}!',
    subtitle: "Let's learn and play together. Pick a magical story or an activity for today.",
    createStory: 'Create a story',
    seeActivities: 'See activities',
    myAchievements: 'My achievements',
    achievementsSummary: '{{conseguidos}}/{{total}}',
    // Encouragement when no achievement has been earned yet (A4/US-73).
    noAchievementsYet: 'Read stories and do activities to earn your first trophies!',
    adultsZone: 'Adults zone',
  },

  // Child achievements / rewards (US-68).
  achievements: {
    title: 'My achievements',
    subtitle: 'Earn medals by reading stories and doing activities.',
    summary: '{{desbloqueados}} of {{total}} achievements',
    progress: '{{progreso}}/{{meta}}',
    unlocked: 'Unlocked!',
    empty: 'No achievements yet. Start playing!',
    errorLoad: 'Could not load the achievements.',
    catCuentos: 'Stories',
    catActividades: 'Activities',
    catRacha: 'Consistency',
    catTemas: 'Explorer',
    goalCuentos_one: 'Read {{count}} story',
    goalCuentos_other: 'Read {{count}} stories',
    goalActividades_one: 'Complete {{count}} activity',
    goalActividades_other: 'Complete {{count}} activities',
    goalRacha_one: '{{count}} day in a row',
    goalRacha_other: '{{count}} days in a row',
    goalTema: 'Explore {{tema}}',
  },

  login: {
    body: 'Enter the email and password you used to create your account. We’ll take you to your profiles.',
    passwordPlaceholder: 'Your password',
    submit: 'Log in',
    noAccount: "Don't have an account? Create one",
    createAccountA11y: 'Create an account',
    failTitle: 'We could not log you in',
    failMessage: 'The email or password is not correct. Check them and try again.',
    errorGeneric: 'Could not log in.',
  },

  consent: {
    gateIntro:
      'To create the account, solve this sum. This way we make sure an adult is setting up the app.',
    title: 'Create your account',
    body: 'You are the person responsible for the child. We need your details to link the profiles and record your consent.',
    nombre: 'First name',
    apellidos: 'Last name',
    passwordPlaceholder: 'Create a password',
    passwordHint: 'At least {{min}} characters, including a letter and a number.',
    parentesco: 'Relationship',
    accept: 'I accept',
    consentText:
      'I give my consent to process the child’s data for the sole purpose of generating stories and activities. The data is not shared with third parties and the content is generated locally. (Version {{version}})',
    submit: 'Accept and continue',
    errorGeneric: 'Could not complete the registration.',
  },

  createProfile: {
    name: "What's your name?",
    namePlaceholder: 'Your name',
    age: 'How old are you?',
    language: 'Language',
    avatar: 'Choose your avatar',
    interests: 'What do you like?',
    submit: 'Done!',
    errorGeneric: 'Could not create the profile.',
  },

  selectProfile: {
    title: "Who's going to play?",
    subtitle: 'Choose a profile to continue.',
    loading: 'Loading profiles…',
    empty: "You don't have any profiles yet. Create the first one to get started.",
    createNew: 'Create new profile',
    chooseA11y: 'Choose {{nombre}}',
    years: '{{edad}} years old',
    errorLoad: 'Could not load the profiles.',
  },

  activities: {
    title: 'Activities for today',
    subtitle: "It's time to play and learn, {{nombre}}!",
    pequeFallback: 'little one',
    category: 'Category',
    all: 'All',
    preparing: 'Preparing activities…',
    retryHint: 'Tap “Generate activities” to try again.',
    emptyNew: 'No new activities. Try another category.',
    generateMore: 'Generate more',
    generate: 'Generate activities',
    errorGenerate: 'Could not generate the activities.',
    errorRating: 'Could not save the rating.',
  },

  storyGenerator: {
    title: 'A story for {{nombre}}',
    youFallback: 'you',
    themes: 'Themes',
    styles: 'Styles',
    teaching: 'What do you want to teach?',
    teachingHint: 'Optional: pick a value for the moral.',
    creating: 'Creating a magical story…',
    retryHint: 'Tap “Generate story” to try again.',
    generateAnother: 'Generate another',
    generate: 'Generate story',
    needThemeStyle: 'Choose at least one theme and one style.',
    errorGenerate: 'Could not generate the story.',
  },

  reader: {
    markRead: 'Mark as read',
    alreadyRead: 'Read',
    // Book-style paginated reading (A2/US-73).
    page: 'Page {{n}} of {{total}}',
    prevPage: 'Previous page',
    nextPage: 'Next page',
  },

  history: {
    title: 'Your history',
    subtitle: 'See everything you have learned and created.',
    sectionStories: 'Magical stories',
    emptyStories: 'No stories yet. Create the first one!',
    sectionActivities: 'Completed activities',
    emptyActivities: 'You have not completed any activities yet.',
    read: 'Read',
    new: 'New',
    readStory: 'Read story',
    readStoryA11y: 'Read the story {{titulo}}',
    errorLoad: 'Could not load the history.',
    // History filters (US-62).
    filterTheme: 'Theme',
    filterStyle: 'Style',
    filterTeaching: 'Teaching',
    filterCategory: 'Category',
    filterAll: 'All',
    filtersTitle: 'Search and filters',
    searchWithCount: 'Search ({{count}})',
    noMatchStories: 'No story matches the filter.',
    noMatchActivities: 'No activity matches the filter.',
    // Favorites and search (US-64).
    searchLabel: 'Search',
    searchPlaceholder: 'Search by title, theme, category…',
    onlyFavorites: 'Only favorites',
    // Highlights + tabs (A3/US-74).
    latest: 'Latest',
    lastStory: 'Last story',
    lastActivity: 'Last activity',
    tabStories: 'Stories',
    tabActivities: 'Activities',
  },

  favorite: {
    add: 'Add to favorites',
    remove: 'Remove from favorites',
  },

  parental: {
    gateIntro: 'This is the adults zone. Solve the sum to manage the account.',
    account: 'Account',
    language: 'App language',
    theme: 'App theme',
    themeSystem: 'Automatic',
    themeLight: 'Light',
    themeDark: 'Dark',
    changeProfile: 'Switch profile',
    logout: 'Log out',
    logoutConfirmTitle: 'Log out',
    logoutConfirmMessage: 'Are you sure you want to log out of this account?',
    sentryTest: 'Test Sentry (dev)',
    sentryTitle: 'Sentry',
    sentrySent: 'Test event sent. Check the Sentry dashboard (Issues).',
    sentryInactive: 'Sentry is not active (no DSN): the event was not sent.',
  },

  activityCard: {
    minutes: '{{min}} min',
    level: 'Level {{nivel}}',
    howTo: 'How to do it',
    showSteps: 'Show steps',
    hideSteps: 'Hide steps',
    done: 'Done!',
    howWasIt: 'How was it?',
    markDone: 'Done',
  },

  authorBadge: {
    author: 'Author: {{proveedor}}',
  },

  narration: {
    idle: 'Listen',
    loading: 'Preparing…',
    playing: 'Pause',
    paused: 'Resume',
    stop: 'Stop',
  },

  parentalGate: {
    title: 'Adults zone',
    bodyDefault: 'To continue, solve this sum. This way we make sure there is an adult.',
    question: '{{a}} + {{b}} = ?',
    wrongTitle: 'Almost',
    wrongMessage: "That's not it. Try another sum.",
  },

  errorFallback: {
    title: 'Oops! Something got distracted',
    body: "It's okay. Let's try again.",
    retry: 'Try again',
  },
};
