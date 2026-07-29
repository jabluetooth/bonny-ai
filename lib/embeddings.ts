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

/**
 * Re-embeds a single project's RAG chunks (overview, tech stack, challenges),
 * replacing any existing chunks for that record first so incremental updates
 * (e.g. from the GitHub content agent) don't accumulate duplicates. Mirrors
 * the per-project chunking scripts/embed-data.ts does during a full rebuild.
 */
export async function embedProjectRecord(
    supabase: SupabaseClient,
    hf: InferenceClient,
    project: EmbeddableProject
): Promise<void> {
    const { error: deleteError } = await supabase
        .from('document_embeddings')
        .delete()
        .eq('metadata->>source_table', 'projects')
        .eq('metadata->>record_id', project.id)

    if (deleteError) {
        console.error(`[embeddings] failed to clear old chunks for project ${project.id}:`, deleteError.message)
    }

    const chunks: { content: string; chunk_type: string }[] = [
        {
            content: `Project: ${project.title}. Type: ${project.type || 'Unknown'}. Description: ${project.description || ''}.`,
            chunk_type: 'overview',
        },
    ]

    if (project.tech_stack && project.tech_stack.length > 0) {
        chunks.push({
            content: `Project ${project.title} uses the following technologies: ${project.tech_stack.join(', ')}.`,
            chunk_type: 'tech_stack',
        })
    }

    if (project.challenges_learned) {
        chunks.push({
            content: `Challenges and learnings from project ${project.title}: ${project.challenges_learned}`,
            chunk_type: 'challenges',
        })
    }

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(hf, chunk.content)
        const { error } = await supabase.from('document_embeddings').insert({
            content: chunk.content,
            embedding,
            metadata: {
                source_table: 'projects',
                record_id: project.id,
                chunk_type: chunk.chunk_type,
                title: project.title,
            },
        })
        if (error) {
            console.error(`[embeddings] failed to insert ${chunk.chunk_type} chunk for project ${project.id}:`, error.message)
        }
    }
}
