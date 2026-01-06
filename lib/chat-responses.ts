
// Helper to format static data
export const formatList = (items: any[], key: string, desc: string) =>
    items?.map(i => `**${i[key]}**: ${i[desc] || ''}`).join('\n') || "No information available.";

// Helper for Variations
export const pickVariation = (variations: string[], name: string = "Guest") => {
    const template = variations[Math.floor(Math.random() * variations.length)];
    const cleanName = name !== "Guest" ? `, ${name}` : "";
    return template.replace("{{name}}", cleanName);
};

// Response Generators
const handleProjects = (intent: string | undefined, content: string, context: any) => {
    const lowerContent = content.toLowerCase();
    const name = context.userName || "Guest";

    if (lowerContent.includes('web') || intent === 'QUERY_PROJECTS_WEB') {
        const webVars = [
            "[[PROJECTS: Web Development]] Here are my **Web Development** projects{{name}}! 🌐",
            "[[PROJECTS: Web Development]] I've built some exciting things for the web. Check them out{{name}} 👇",
            "[[PROJECTS: Web Development]] Exploring the full stack is my passion. Here are my web projects! 💻"
        ];
        return pickVariation(webVars, name);
    } else if (lowerContent.includes('ai') || lowerContent.includes('machine learning') || intent === 'QUERY_PROJECTS_AI') {
        const aiVars = [
            "[[PROJECTS: AI & ML]] Check out my **AI & Machine Learning** innovations{{name}}! 🤖",
            "[[PROJECTS: AI & ML]] Here's how I'm using AI to solve problems. Take a look{{name}}!",
            "[[PROJECTS: AI & ML]] Diving into the future with AI & ML. Here are projects 🧠"
        ];
        return pickVariation(aiVars, name);
    } else {
        const genVars = [
            "[[SHOW_PROJECTS]] Check out my projects below{{name}}! 🚀",
            "[[SHOW_PROJECTS]] Here is a collection of my work. Enjoy{{name}}!",
            "[[SHOW_PROJECTS]] I'm proud of what I've built. Have a look{{name}} 👇"
        ];
        return pickVariation(genVars, name);
    }
};

const handleSkills = (intent: string | undefined, content: string) => {
    const lowerContent = content.toLowerCase();
    if (intent === 'QUERY_SKILLS_FRONTEND' || lowerContent.includes('frontend'))
        return "[[CATEGORY: Frontend Development]] Here are my Frontend skills.";
    if (intent === 'QUERY_SKILLS_BACKEND' || lowerContent.includes('backend'))
        return "[[CATEGORY: Backend Development]] Here are my Backend skills.";
    if (intent === 'QUERY_SKILLS_DESIGN' || lowerContent.includes('design'))
        return "[[CATEGORY: Design]] I love creating beautiful UIs.";
    if (intent === 'QUERY_SKILLS_OTHER' || lowerContent.includes('other'))
        return "[[CATEGORY: Other]] Here are my other skills.";

    return "[[SHOW_SKILLS]] Here are my technical skills.";
};

// Main Strategy Map
export function getDeterministicResponse(intent: string | undefined, content: string, context: any): string {
    if (!intent) return "";

    // 1. Complex Handlers (Logic-based)
    if (intent.startsWith('QUERY_PROJECTS')) return handleProjects(intent, content, context);
    if (intent.startsWith('QUERY_SKILLS')) return handleSkills(intent, content);

    // 2. Simple Map (Intent -> Response)
    const simpleResponses: Record<string, string | (() => string)> = {
        'QUERY_WORK': "[[SHOW_EXPERIENCE:WORK]] Here is my professional work history.",
        'QUERY_EDUCATION': "[[SHOW_EXPERIENCE:EDUCATION]] Here is my educational background.",
        'QUERY_EXPERIENCE': "[[SHOW_EXPERIENCE:WORK]] Here is my professional experience.",
        'QUERY_INTERESTS': "[[SHOW_INTERESTS]] Here are my interests and hobbies! 📸",
        'QUERY_VISION': "[[SHOW_VISION]] Here is my vision for the future! 🔮",
        'QUERY_BACKGROUND': "[[SHOW_BACKGROUND]] Here is a visual overview of my journey! 🗺️",
        'QUERY_ABOUT_ME': () => {
            const aboutContent = context.about?.map((a: any) => a.content).filter(Boolean).join('\n\n') || '';
            return `[[SHOW_ABOUT]] Here is a bit about me:\n\n${aboutContent || "I'm a passionate developer who loves building great software!"}`;
        }
    };

    const match = simpleResponses[intent];
    if (typeof match === 'function') return match();
    if (match) return match;

    return "";
}
