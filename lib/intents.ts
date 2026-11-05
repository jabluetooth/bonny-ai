export const ChatIntents = {
    // About
    ABOUT_ME: 'QUERY_ABOUT_ME',

    // Business
    SERVICES: 'QUERY_SERVICES',
    CONTACT: 'QUERY_CONTACT',

    // Case studies (projects)
    PROJECTS_WEB: 'QUERY_PROJECTS_WEB',
    PROJECTS_AI: 'QUERY_PROJECTS_AI',
    PROJECTS_ALL: 'QUERY_PROJECTS_ALL',

    // Skills
    SKILLS_FRONTEND: 'QUERY_SKILLS_FRONTEND',
    SKILLS_BACKEND: 'QUERY_SKILLS_BACKEND',
    SKILLS_DESIGN: 'QUERY_SKILLS_DESIGN',
    SKILLS_OTHER: 'QUERY_SKILLS_OTHER',
    SKILLS_ALL: 'QUERY_SKILLS_ALL',

    // Experience
    WORK_HISTORY: 'QUERY_WORK_HISTORY',
    EDUCATION: 'QUERY_EDUCATION',
} as const;

export type ChatIntentType = typeof ChatIntents[keyof typeof ChatIntents];

// Keyword patterns for intent detection. Order matters: the first match
// wins, so the more specific intents come first. Anything that doesn't
// match falls through to the LLM + RAG path, which is where open-ended
// business questions ("how would you cut our support costs?") belong.
const INTENT_PATTERNS: { intent: ChatIntentType; patterns: RegExp[] }[] = [
    // Contact / hire
    {
        intent: ChatIntents.CONTACT,
        patterns: [
            /\b(contact|get\s*in\s*touch|reach\s*(you|out)|book\s*(a\s*)?(call|meeting)|schedule\s*(a\s*)?(call|meeting)|hire\s*you|work\s*with\s*you|email\s*you|your\s*email)\b/i,
        ]
    },
    // Services / problems solved
    {
        intent: ChatIntents.SERVICES,
        patterns: [
            /\b(services?|offerings?|what\s*do\s*you\s*offer|problems?\s*(do\s*)?you\s*solve|what\s*can\s*you\s*(do|help)|how\s*can\s*you\s*help)\b/i,
            /\b(grow|scale|automate)\s*(my|our)\s*(business|company|team|operations?)\b/i,
        ]
    },
    // About Me
    {
        intent: ChatIntents.ABOUT_ME,
        patterns: [
            /\b(about\s*(you|yourself)|who\s*(are|is)\s*(you|fil)|introduce\s*yourself|tell\s*me\s*about\s*yourself)\b/i,
            /^(who\s*(are|is)\s*you|about\s*you)\??$/i,
        ]
    },
    // Case studies / projects
    {
        intent: ChatIntents.PROJECTS_ALL,
        patterns: [
            /\b(projects?|portfolio|case\s*stud(y|ies)|client\s*work|apps?|built|created|developed|showcase|results)\b/i,
            /what\s*(have\s*you|did\s*you)\s*(built|made|created|developed|delivered)/i,
            /show\s*(me\s*)?(your\s*)?(projects?|work|portfolio)/i,
        ]
    },
    // Skills
    {
        intent: ChatIntents.SKILLS_ALL,
        patterns: [
            /\b(skills?|technologies?|tech\s*stack|stack|tools?|frameworks?|languages?|expertise|proficient)\b/i,
            /what\s*(do\s*you|can\s*you)\s*(know|use|work\s*with)/i,
        ]
    },
    // Experience/Work
    {
        intent: ChatIntents.WORK_HISTORY,
        patterns: [
            /\b(experience|work\s*history|career|jobs?|employment|worked\s*(at|for)|positions?|background)\b/i,
            /where\s*(have\s*you|did\s*you)\s*work/i,
        ]
    },
    // Education
    {
        intent: ChatIntents.EDUCATION,
        patterns: [
            /\b(education|school|university|college|degree|studied|academic|graduated|certifications?)\b/i,
            /where\s*did\s*you\s*(study|go\s*to\s*school)/i,
        ]
    },
];

/**
 * Detect intent from user message using keyword patterns
 * Returns undefined if no strong match is found (falls back to RAG)
 */
export function detectIntent(message: string): ChatIntentType | undefined {
    const normalizedMessage = message.toLowerCase().trim();

    for (const { intent, patterns } of INTENT_PATTERNS) {
        for (const pattern of patterns) {
            if (pattern.test(normalizedMessage)) {
                return intent;
            }
        }
    }

    return undefined;
}
