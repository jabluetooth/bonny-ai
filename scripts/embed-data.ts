
import { createClient } from '@supabase/supabase-js';
import { InferenceClient } from '@huggingface/inference';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { generateEmbedding as sharedGenerateEmbedding, embedProjectRecord } from '../lib/embeddings';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

// Init Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const hf = new InferenceClient(HF_API_KEY || undefined);

async function generateEmbedding(text: string): Promise<number[]> {
    try {
        return await sharedGenerateEmbedding(hf, text);
    } catch (error) {
        console.error(`Error generating embedding for: "${text.substring(0, 50)}..."`, error);
        throw error;
    }
}

async function processProfiles() {
    console.log('Processing Profiles...');
    const { data: profiles } = await supabase.from('author_profiles').select('*');
    if (!profiles || profiles.length === 0) {
        console.log('  No profiles found in database (skipping).');
        return;
    }

    for (const p of profiles) {
        // Main bio/about chunk - include multiple keywords for better semantic matching
        const content = `About Me - Personal Introduction and Biography: ${p.description || ''}. ${p.summary || ''}`.trim();
        const embedding = await generateEmbedding(content);

        const { error } = await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: {
                source_table: 'author_profiles',
                record_id: p.id,
                chunk_type: 'main_bio'
            }
        });
        if (error) console.error('  Error inserting profile bio:', error.message);

        // Additional profile fields if available
        if (p.tagline || p.headline) {
            const taglineContent = `Who am I - Professional Summary: ${p.tagline || p.headline}`;
            const taglineEmbedding = await generateEmbedding(taglineContent);

            const { error: taglineError } = await supabase.from('document_embeddings').insert({
                content: taglineContent,
                embedding: taglineEmbedding,
                metadata: {
                    source_table: 'author_profiles',
                    record_id: p.id,
                    chunk_type: 'tagline'
                }
            });
            if (taglineError) console.error('  Error inserting profile tagline:', taglineError.message);
        }
    }
    console.log(`  Embedded ${profiles.length} profiles.`);
}

async function processProjects() {
    console.log('Processing Projects...');
    // tech_stack isn't a column on `projects` itself — it's derived via the
    // project_skills join, same as app/api/projects/route.ts.
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*, project_skills(skills(name))');
    if (error || !projects) {
        if (error) console.error('  Error fetching projects:', error.message);
        return;
    }

    for (const p of projects) {
        const techStack = (p.project_skills || [])
            .map((ps: any) => ps.skills?.name)
            .filter(Boolean);
        await embedProjectRecord(supabase, hf, { ...p, tech_stack: techStack });
    }
    console.log(`  Embedded ${projects.length} projects.`);
}

async function processSkills() {
    console.log('Processing Skills...');
    // Join with Categories for better context
    const { data: skills } = await supabase.from('skills').select('*, skill_categories(title)');
    if (!skills) return;

    for (const s of skills) {
        const category = (s as any).skill_categories?.title || 'General';
        const content = `Skill: ${s.name} is a ${category} technology.${s.description ? ` Description: ${s.description}` : ''}`;
        const embedding = await generateEmbedding(content);

        const { error } = await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: { source_table: 'skills', record_id: s.id, chunk_type: 'definition' }
        });
        if (error) console.error(`  Error inserting skill (${s.name}):`, error.message);
    }
    console.log(`  Embedded ${skills.length} skills.`);
}

async function processExperience() {
    console.log('Processing Experiences...');
    const { data: experiences } = await supabase.from('experiences').select('*');
    if (!experiences || experiences.length === 0) {
        console.log('  No experiences found in database (skipping).');
        return;
    }

    for (const e of experiences) {
        const date = e.date_range || e.date || 'Unknown Date';
        const content = `Experience: Worked as ${e.role} at ${e.company} (${date}). Type: ${e.category || e.type}. Location: ${e.location}.`;
        const embedding = await generateEmbedding(content);

        const { error } = await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: { source_table: 'experiences', record_id: e.id, chunk_type: 'role_overview' }
        });
        if (error) console.error(`  Error inserting experience (${e.role}):`, error.message);

        if (e.description && Array.isArray(e.description)) {
            const contentDesc = `Details for ${e.role} at ${e.company}: ${e.description.join(' ')}`;
            const embeddingDesc = await generateEmbedding(contentDesc);

            const { error: descError } = await supabase.from('document_embeddings').insert({
                content: contentDesc,
                embedding: embeddingDesc,
                metadata: { source_table: 'experiences', record_id: e.id, chunk_type: 'details' }
            });
            if (descError) console.error(`  Error inserting experience details (${e.role}):`, descError.message);
        }
    }
    console.log(`  Embedded ${experiences.length} experiences.`);
}

async function processInterests() {
    console.log('Processing Interests...');
    const { data: interests } = await supabase.from('interests').select('*');
    if (!interests || interests.length === 0) {
        console.log('  No interests found in database (skipping).');
        return;
    }

    for (const i of interests) {
        // Clean title: remove trailing colon if present
        const cleanTitle = (i.title || '').replace(/:$/, '').trim();
        const description = (i.description || '').trim();

        // Include keywords: hobbies, interests, free time, what I like, passions, personal life
        const content = `My Hobby and Personal Interest: ${cleanTitle}. ${description}`.trim();
        const embedding = await generateEmbedding(content);

        const { error } = await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: {
                source_table: 'interests',
                record_id: i.id,
                chunk_type: 'hobby_interest',
                title: cleanTitle
            }
        });
        if (error) console.error(`  Error inserting interest (${cleanTitle}):`, error.message);
    }
    console.log(`  Embedded ${interests.length} interests.`);
}

async function processBackgroundCards() {
    console.log('Processing Background Cards...');
    const { data: cards } = await supabase.from('background_cards').select('*');
    if (!cards || cards.length === 0) {
        console.log('  No background cards found in database (skipping).');
        return;
    }

    for (const c of cards) {
        // Clean title: remove trailing colon if present
        const cleanTitle = (c.title || '').replace(/:$/, '').trim();
        const description = (c.description || '').trim();
        const dateInfo = c.date_range ? ` (${c.date_range})` : '';
        const category = c.category ? ` [${c.category}]` : '';

        // Include keywords: background, journey, story, path, milestone, education, history
        const content = `My Journey and Background${category}: ${cleanTitle}${dateInfo}. ${description}`.trim();
        const embedding = await generateEmbedding(content);

        const { error } = await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: {
                source_table: 'background_cards',
                record_id: c.id,
                chunk_type: 'journey_milestone',
                title: cleanTitle,
                category: c.category || 'general'
            }
        });
        if (error) console.error(`  Error inserting background card (${cleanTitle}):`, error.message);
    }
    console.log(`  Embedded ${cards.length} background cards.`);
}

async function processVisionCards() {
    console.log('Processing Vision Cards...');
    const { data: cards } = await supabase.from('vision_cards').select('*');
    if (!cards || cards.length === 0) {
        console.log('  No vision cards found in database (skipping).');
        return;
    }

    for (const v of cards) {
        // Clean title: remove trailing colon if present
        const cleanTitle = (v.title || '').replace(/:$/, '').trim();
        const quote = (v.quote || '').trim();
        const attribution = v.name ? ` - ${v.name}` : '';
        const category = cleanTitle ? ` [${cleanTitle}]` : '';

        // Include keywords: vision, goals, aspirations, philosophy, beliefs, values, inspiration, motivation
        const content = `My Vision and Inspiration${category}: "${quote}"${attribution}`.trim();
        const embedding = await generateEmbedding(content);

        const { error } = await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: {
                source_table: 'vision_cards',
                record_id: v.id,
                chunk_type: 'vision_quote',
                author: v.name,
                category: cleanTitle || 'inspiration'
            }
        });
        if (error) console.error(`  Error inserting vision card (${cleanTitle}):`, error.message);
    }
    console.log(`  Embedded ${cards.length} vision cards.`);
}

async function main() {
    console.log('Starting ingestion...');

    // Clear old embeddings to avoid duplicates on re-runs
    const { error: deleteError } = await supabase.from('document_embeddings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) console.warn('Error clearing table (might be empty):', deleteError.message);
    else console.log('Cleared existing embeddings.');

    // Core professional data
    await processProfiles();
    await processProjects();
    await processSkills();
    await processExperience();

    // Personal/About section data
    await processInterests();
    await processBackgroundCards();
    await processVisionCards();

    // Verify final count
    const { count, error: countError } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('\nError getting final count:', countError.message);
    } else {
        console.log(`\nIngestion complete! Total embeddings in database: ${count}`);
    }
}

main().catch(console.error);
