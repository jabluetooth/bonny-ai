// Deterministic replies for intents that only need to surface a UI block.
// These skip the LLM entirely (no tokens, no latency), so they're kept
// short, neutral and business-focused: the component below the message
// carries the substance.

const handleProjects = (intent: string | undefined, content: string) => {
    const lowerContent = content.toLowerCase();

    if (intent === 'QUERY_PROJECTS_WEB' || /\bweb\b/.test(lowerContent)) {
        return "[[PROJECTS: Web Development]] Here are the web platforms I've delivered. Each case study covers the problem, what I built, and the result.";
    }
    if (intent === 'QUERY_PROJECTS_AI' || /\b(ai|machine learning|automation)\b/.test(lowerContent)) {
        return "[[PROJECTS: AI & ML]] Here's my AI and automation work. Each case study covers the problem, what I built, and the result.";
    }
    return "[[SHOW_PROJECTS]] Here are selected case studies. Open one to see the problem, the solution, and the measurable outcome.";
};

const handleSkills = (intent: string | undefined, content: string) => {
    const lowerContent = content.toLowerCase();
    if (intent === 'QUERY_SKILLS_FRONTEND' || lowerContent.includes('frontend'))
        return "[[CATEGORY: Frontend Development]] These are the frontend tools I use to ship customer-facing products.";
    if (intent === 'QUERY_SKILLS_BACKEND' || lowerContent.includes('backend'))
        return "[[CATEGORY: Backend Development]] These are the backend and data tools I build reliable systems with.";
    if (intent === 'QUERY_SKILLS_DESIGN' || lowerContent.includes('design'))
        return "[[CATEGORY: Design]] These are the design tools I use to keep products clear and usable.";
    if (intent === 'QUERY_SKILLS_OTHER' || lowerContent.includes('other'))
        return "[[CATEGORY: Other]] Beyond the code, these are the skills I bring to a team or engagement.";

    return "[[SHOW_SKILLS]] Here's my technical stack, grouped by area.";
};

// Main Strategy Map
export function getDeterministicResponse(intent: string | undefined, content: string): string {
    if (!intent) return "";

    if (intent.startsWith('QUERY_PROJECTS')) return handleProjects(intent, content);
    if (intent.startsWith('QUERY_SKILLS')) return handleSkills(intent, content);

    const simpleResponses: Record<string, string> = {
        'QUERY_SERVICES': "[[SHOW_SERVICES]] These are the problems I help businesses solve, what I do about each one, and the outcome you can expect.",
        'QUERY_CONTACT': "[[SHOW_CONTACT]] The fastest way to start is a short message about what you're trying to fix. I'll reply with next steps.",
        'QUERY_WORK_HISTORY': "[[SHOW_EXPERIENCE:WORK]] Here is my professional experience.",
        'QUERY_EXPERIENCE': "[[SHOW_EXPERIENCE:WORK]] Here is my professional experience.",
        'QUERY_EDUCATION': "[[SHOW_EXPERIENCE:EDUCATION]] Here is my education and training.",
        'QUERY_ABOUT_ME': "[[SHOW_ABOUT]] Here's a short overview of who I am and how I work.",
    };

    return simpleResponses[intent] ?? "";
}
