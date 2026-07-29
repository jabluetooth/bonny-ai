import { InferenceClient } from '@huggingface/inference'
import type { SupabaseClient } from '@supabase/supabase-js'

// Configuration matching lib/rag.ts
export const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'

export async function generateEmbedding(hf: InferenceClient, text: string): Promise<number[]> {
    const response = await hf.featureExtraction({
        model: EMBEDDING_MODEL,
        inputs: text,
    })

    if (Array.isArray(response) && Array.isArray(response[0])) {
        // Handle batched response (though we send one string)
        return response[0] as number[]
    }
    return Array.from(response as number[] | Float32Array)
}

interface EmbeddableProject {
    id: string
    title: string
    type?: string | null
    description?: string | null
    tech_stack?: string[] | null
    challenges_learned?: string | null
}

interface Chunk {
    content: string
    chunk_type: string
    extraMetadata?: Record<string, unknown>
}

/**
 * Replaces all RAG chunks for one (source_table, record_id) with a fresh
 * set, so incremental updates (e.g. from the GitHub content agent) don't
 * accumulate duplicates the way a full rebuild's upfront wipe does.
 */
async function replaceRecordChunks(
    supabase: SupabaseClient,
    hf: InferenceClient,
    sourceTable: string,
    recordId: string,
    chunks: Chunk[]
): Promise<void> {
    const { error: deleteError } = await supabase
        .from('document_embeddings')
        .delete()
        .eq('metadata->>source_table', sourceTable)
        .eq('metadata->>record_id', recordId)

    if (deleteError) {
        console.error(`[embeddings] failed to clear old ${sourceTable} chunks for ${recordId}:`, deleteError.message)
    }

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(hf, chunk.content)
        const { error } = await supabase.from('document_embeddings').insert({
            content: chunk.content,
            embedding,
            metadata: {
                source_table: sourceTable,
                record_id: recordId,
                chunk_type: chunk.chunk_type,
                ...chunk.extraMetadata,
            },
        })
        if (error) {
            console.error(`[embeddings] failed to insert ${chunk.chunk_type} chunk for ${sourceTable} ${recordId}:`, error.message)
        }
    }
}

/**
 * Re-embeds a single project's RAG chunks (overview, tech stack, challenges).
 * Mirrors the per-project chunking scripts/embed-data.ts does during a full rebuild.
 */
export async function embedProjectRecord(
    supabase: SupabaseClient,
    hf: InferenceClient,
    project: EmbeddableProject
): Promise<void> {
    const chunks: Chunk[] = [
        {
            content: `Project: ${project.title}. Type: ${project.type || 'Unknown'}. Description: ${project.description || ''}.`,
            chunk_type: 'overview',
            extraMetadata: { title: project.title },
        },
    ]

    if (project.tech_stack && project.tech_stack.length > 0) {
        chunks.push({
            content: `Project ${project.title} uses the following technologies: ${project.tech_stack.join(', ')}.`,
            chunk_type: 'tech_stack',
            extraMetadata: { title: project.title },
        })
    }

    if (project.challenges_learned) {
        chunks.push({
            content: `Challenges and learnings from project ${project.title}: ${project.challenges_learned}`,
            chunk_type: 'challenges',
        })
    }

    await replaceRecordChunks(supabase, hf, 'projects', project.id, chunks)
}

interface EmbeddableProfile {
    id: string
    description?: string | null
}

/**
 * Re-embeds the "About Me" bio chunk for the author profile. Mirrors the
 * main_bio chunk scripts/embed-data.ts's processProfiles() produces.
 */
export async function embedProfileRecord(
    supabase: SupabaseClient,
    hf: InferenceClient,
    profile: EmbeddableProfile
): Promise<void> {
    const content = `About Me - Personal Introduction and Biography: ${profile.description || ''}`.trim()
    await replaceRecordChunks(supabase, hf, 'author_profiles', profile.id, [
        { content, chunk_type: 'main_bio' },
    ])
}
