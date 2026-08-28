import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Fil Heinz | Talk to My Portfolio',
        short_name: 'Fil Heinz',
        description: 'Fil Heinz O. Re La Torre - Software Engineer specializing in full-stack web development and AI/ML. Ask the AI chatbot about my work, skills, and experience.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
            {
                src: '/bot-avatar.png',
                sizes: '522x560',
                type: 'image/png',
            },
        ],
    };
}
