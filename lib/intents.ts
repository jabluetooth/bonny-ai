export const ChatIntents = {
    ABOUT_ME: 'QUERY_ABOUT_ME',
    WORK: 'QUERY_WORK',
    EDUCATION: 'QUERY_EDUCATION',
    PROJECTS: 'QUERY_PROJECTS',
    SKILLS: 'QUERY_SKILLS',
    INTERESTS: 'QUERY_INTERESTS',
    VISION: 'QUERY_VISION',
} as const;

export type ChatIntentType = typeof ChatIntents[keyof typeof ChatIntents];
