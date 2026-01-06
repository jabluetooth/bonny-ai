
import { createClient } from '@supabase/supabase-js';
import { InferenceClient } from '@huggingface/inference';
import * as dotenv from 'dotenv';
import { join } from 'path';

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

// Configuration matching lib/rag.ts
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await hf.featureExtraction({
            model: EMBEDDING_MODEL,
            inputs: text,
        });

        if (Array.isArray(response) && Array.isArray(response[0])) {
            // Handle batched response (though we send one string)
            return response[0] as number[];
        }
        return Array.from(response as number[] | Float32Array);
    } catch (error) {
        console.error(`Error generating embedding for: "${text.substring(0, 50)}..."`, error);
        throw error;
    }
}

async function processProfiles() {
    console.log('Processing Profiles...');
    const { data: profiles } = await supabase.from('author_profiles').select('id, description');
    if (!profiles) return;

    for (const p of profiles) {
        const content = `About the Author: ${p.description}.`;
        const embedding = await generateEmbedding(content);

        await supabase.from('document_embeddings').upsert({
            content,
            embedding,
            metadata: {
                source_table: 'author_profiles',
                record_id: p.id,
                chunk_type: 'main_bio'
            }
        }, { onConflict: 'id' as never }); // 'id' won't work for upsert unless we generate a consistent UUID or fetch existing. 
        // Actually, for simplicity in this script, we'll just insert new records or we'd need a way to dedupe.
        // Better strategy: Delete existing embeddings for this table first?
    }
}

async function processProjects() {
    console.log('Processing Projects...');
    const { data: projects } = await supabase.from('projects').select('*');
    if (!projects) return;

    for (const p of projects) {
        // Chunk 1: General Info
        const contentMain = `Project: ${p.title}. Type: ${p.type}. Description: ${p.description}.`;
        const embeddingMain = await generateEmbedding(contentMain);

        await supabase.from('document_embeddings').insert({
            content: contentMain,
            embedding: embeddingMain,
            metadata: { source_table: 'projects', record_id: p.id, chunk_type: 'overview', title: p.title }
        });

        // Chunk 2: Tech Stack
        if (p.tech_stack && p.tech_stack.length > 0) {
            const contentTech = `Project ${p.title} uses the following technologies: ${p.tech_stack.join(', ')}.`;
            const embeddingTech = await generateEmbedding(contentTech);

            await supabase.from('document_embeddings').insert({
                content: contentTech,
                embedding: embeddingTech,
                metadata: { source_table: 'projects', record_id: p.id, chunk_type: 'tech_stack', title: p.title }
            });
        }

        // Chunk 3: Challenges/Features
        if (p.challenges_learned) {
            const contentChallenges = `Challenges and learnings from project ${p.title}: ${p.challenges_learned}`;
            const embeddingChallenges = await generateEmbedding(contentChallenges);

            await supabase.from('document_embeddings').insert({
                content: contentChallenges,
                embedding: embeddingChallenges,
                metadata: { source_table: 'projects', record_id: p.id, chunk_type: 'challenges' }
            });
        }
    }
}

async function processSkills() {
    console.log('Processing Skills...');
    // Join with Categories for better context
    const { data: skills } = await supabase.from('skills').select('*, skill_categories(title)');
    if (!skills) return;

    for (const s of skills) {
        // @ts-ignore
        const category = s.skill_categories?.title || 'General';
        const content = `Skill: ${s.name} is a ${category} technology.${s.description ? ` Description: ${s.description}` : ''}`;
        const embedding = await generateEmbedding(content);

        await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: { source_table: 'skills', record_id: s.id, chunk_type: 'definition' }
        });
    }
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

        await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: { source_table: 'experiences', record_id: e.id, chunk_type: 'role_overview' }
        });

        if (e.description && Array.isArray(e.description)) {
            const contentDesc = `Details for ${e.role} at ${e.company}: ${e.description.join(' ')}`;
            const embeddingDesc = await generateEmbedding(contentDesc);

            await supabase.from('document_embeddings').insert({
                content: contentDesc,
                embedding: embeddingDesc,
                metadata: { source_table: 'experiences', record_id: e.id, chunk_type: 'details' }
            });
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
        const content = `Personal Interest/Hobby: ${i.title}. ${i.description || ''}`.trim();
        const embedding = await generateEmbedding(content);

        await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: { source_table: 'interests', record_id: i.id, chunk_type: 'hobby', title: i.title }
        });
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
        const dateInfo = c.date_range ? ` (${c.date_range})` : '';
        const content = `Background/Milestone: ${c.title}${dateInfo}. ${c.description || ''}`.trim();
        const embedding = await generateEmbedding(content);

        await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: { source_table: 'background_cards', record_id: c.id, chunk_type: 'milestone', title: c.title }
        });
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
        // Include quote attribution for better context
        const attribution = v.name ? ` - ${v.name}` : '';
        const category = v.title ? ` [${v.title}]` : '';
        const content = `Vision/Inspiration: "${v.quote}"${attribution}${category}`.trim();
        const embedding = await generateEmbedding(content);

        await supabase.from('document_embeddings').insert({
            content,
            embedding,
            metadata: { source_table: 'vision_cards', record_id: v.id, chunk_type: 'quote', author: v.name }
        });
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

    console.log('\nIngestion complete!');
}

main().catch(console.error);
