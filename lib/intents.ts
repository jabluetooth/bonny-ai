export const ChatIntents = {
    // About
    ABOUT_ME: 'QUERY_ABOUT_ME',
    BACKGROUND: 'QUERY_BACKGROUND',
    INTERESTS: 'QUERY_INTERESTS',
    VISION: 'QUERY_VISION',

    // Projects
    PROJECTS_WEB: 'QUERY_PROJECTS_WEB',
    PROJECTS_AI: 'QUERY_PROJECTS_AI',
    PROJECTS_ALL: 'QUERY_PROJECTS_ALL', // Dynamic fallback

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

// Keyword patterns for intent detection
const INTENT_PATTERNS: { intent: ChatIntentType; patterns: RegExp[] }[] = [
    // Interests/Hobbies - most specific first
    {
        intent: ChatIntents.INTERESTS,
        patterns: [
            /\b(hobbies|hobby|interests?|free\s*time|spare\s*time|pastime|leisure|for\s*fun|enjoy\s*doing|like\s*to\s*do|passionate\s*about|love\s*doing)\b/i,
            /what\s*(do\s*you|are\s*your).*(like|enjoy|love|do\s*for\s*fun)/i,
            /outside\s*(of\s*)?(work|coding|programming)/i,
        ]
    },
    // Vision/Goals
    {
        intent: ChatIntents.VISION,
        patterns: [
            /\b(vision|goals?|aspirations?|dreams?|ambitions?|future\s*plans?|where\s*do\s*you\s*see|motivat|inspir|philosophy|values?|beliefs?)\b/i,
            /what\s*(drives?|motivates?)\s*(you|your)/i,
            /\b(favorite|inspiring)\s*(quotes?|sayings?)\b/i,
        ]
    },
    // Background/Journey
    {
        intent: ChatIntents.BACKGROUND,
        patterns: [
            /\b(background|journey|story|path|history|milestones?|timeline|how\s*did\s*you\s*(start|begin|get\s*into))\b/i,
            /\b(tell\s*me\s*about\s*your\s*(journey|background|story|path))\b/i,
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
    // Projects
    {
        intent: ChatIntents.PROJECTS_ALL,
        patterns: [
            /\b(projects?|portfolio|work|apps?|built|created|developed|made|showcase)\b/i,
            /what\s*(have\s*you|did\s*you)\s*(built|made|created|developed)/i,
            /show\s*(me\s*)?(your\s*)?(projects?|work|portfolio)/i,
        ]
    },
    // Skills
    {
        intent: ChatIntents.SKILLS_ALL,
        patterns: [
            /\b(skills?|technologies?|tech\s*stack|stack|tools?|frameworks?|languages?|expertise|proficient|know\s*how)\b/i,
            /what\s*(do\s*you|can\s*you)\s*(know|use|work\s*with)/i,
        ]
    },
    // Experience/Work
    {
        intent: ChatIntents.WORK_HISTORY,
        patterns: [
            /\b(experience|work\s*history|career|jobs?|employment|worked\s*(at|for)|positions?)\b/i,
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
