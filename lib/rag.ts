/**
 * RAG (Retrieval Augmented Generation) Utility
 *
 * Provides semantic search over portfolio content using vector embeddings.
 * Complements the intent-based context system (chat-context.ts) with
 * similarity-based retrieval for more nuanced queries.
 *
 * Uses HuggingFace Inference API (free) for embeddings.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { InferenceClient } from '@huggingface/inference';

// ============================================
// Configuration
// ============================================

const CONFIG = {
    // HuggingFace model - must match the one used in embed-data.ts
    EMBEDDING_MODEL: 'sentence-transformers/all-MiniLM-L6-v2',
    EMBEDDING_DIMENSIONS: 384,
    DEFAULT_MATCH_THRESHOLD: 0.72,
    DEFAULT_MATCH_COUNT: 5,
    MAX_CONTEXT_CHARS: 3000, // ~750 tokens, leaves room for system prompt
    CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
};

// ============================================
// Types
// ============================================

export interface RAGDocument {
    id: string;
    content: string;
    metadata: {
        source_table: string;
        record_id: string;
        chunk_type: string;
        title?: string;
        [key: string]: unknown;
    };
    similarity: number;
}

export interface RAGContext {
    documents: RAGDocument[];
    formattedContext: string;
    totalChars: number;
    truncated: boolean;
}

export interface RAGOptions {
    matchThreshold?: number;
    matchCount?: number;
    maxChars?: number;
    filterSource?: string; // Filter by source_table (e.g., 'projects', 'skills')
    searchTerm?: string;   // Keyword fallback for exact matches
}

// ============================================
// Simple In-Memory Cache for Query Embeddings
// ============================================

interface CacheEntry {
    embedding: number[];
    timestamp: number;
}

const embeddingCache = new Map<string, CacheEntry>();

function getCachedEmbedding(query: string): number[] | null {
    const entry = embeddingCache.get(query.toLowerCase().trim());
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > CONFIG.CACHE_TTL_MS) {
        embeddingCache.delete(query.toLowerCase().trim());
        return null;
    }

    return entry.embedding;
}

function setCachedEmbedding(query: string, embedding: number[]): void {
    // Limit cache size to prevent memory issues
    if (embeddingCache.size > 100) {
        // Remove oldest entries
        const entries = Array.from(embeddingCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < 20; i++) {
            embeddingCache.delete(entries[i][0]);
        }
    }

    embeddingCache.set(query.toLowerCase().trim(), {
        embedding,
        timestamp: Date.now(),
    });
}

// ============================================
// HuggingFace Client (lazy initialization)
// ============================================

let hfClient: InferenceClient | null = null;

function getHfClient(): InferenceClient {
    if (!hfClient) {
        // HF_API_KEY is optional - works without but with rate limits
        const apiKey = process.env.HF_API_KEY;
        hfClient = new InferenceClient(apiKey || undefined);
    }
    return hfClient;
}

// ============================================
// Core Functions
// ============================================

/**
 * Generate embedding for a query string using HuggingFace
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
    // Check cache first
    const cached = getCachedEmbedding(query);
    if (cached) {
        return cached;
    }

    const hf = getHfClient();

    const response = await hf.featureExtraction({
        model: CONFIG.EMBEDDING_MODEL,
        inputs: query,
    });

    // Response is the embedding array directly
    const embedding = Array.isArray(response)
        ? (response as number[])
        : Array.from(response as Float32Array);

    // Cache the result
    setCachedEmbedding(query, embedding);

    return embedding;
}

/**
 * Retrieve relevant documents from the vector store
 */
async function matchDocuments(
    supabase: SupabaseClient,
    queryEmbedding: number[],
    options: RAGOptions = {}
): Promise<RAGDocument[]> {
    const {
        matchThreshold = CONFIG.DEFAULT_MATCH_THRESHOLD,
        matchCount = CONFIG.DEFAULT_MATCH_COUNT,
        filterSource,
        searchTerm,
    } = options;

    // Call the RPC function
    const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_source: filterSource || null,
        search_term: searchTerm || null,
    });

    if (error) {
        console.error('RAG match_documents error:', error);
        throw new Error(`Failed to retrieve documents: ${error.message}`);
    }

    return (data || []) as RAGDocument[];
}

/**
 * Format retrieved documents into a context string for the LLM
 */
function formatContext(
    documents: RAGDocument[],
    maxChars: number = CONFIG.MAX_CONTEXT_CHARS
): { formatted: string; truncated: boolean } {
    if (documents.length === 0) {
        return { formatted: '', truncated: false };
    }

    // Group by source for better organization
    const grouped = documents.reduce((acc, doc) => {
        const source = doc.metadata.source_table;
        if (!acc[source]) acc[source] = [];
        acc[source].push(doc);
        return acc;
    }, {} as Record<string, RAGDocument[]>);

    const sections: string[] = [];
    let totalChars = 0;
    let truncated = false;

    // Priority order for sources
    const sourceOrder = ['projects', 'skills', 'experiences', 'interests', 'background_cards', 'vision_cards', 'author_profiles'];

    for (const source of sourceOrder) {
        const docs = grouped[source];
        if (!docs || docs.length === 0) continue;

        const sourceLabel = source.replace('_', ' ').toUpperCase();
        let sectionContent = `[${sourceLabel}]\n`;

        for (const doc of docs) {
            const line = `- ${doc.content}\n`;

            // Check if adding this would exceed limit
            if (totalChars + sectionContent.length + line.length > maxChars) {
                truncated = true;
                break;
            }

            sectionContent += line;
        }

        if (sectionContent.length > `[${sourceLabel}]\n`.length) {
            sections.push(sectionContent);
            totalChars += sectionContent.length;
        }

        if (truncated) break;
    }

    return {
        formatted: sections.join('\n'),
        truncated,
    };
}

// ============================================
// Main Export
// ============================================

/**
 * Retrieve context for a user query using semantic search
 *
 * @param supabase - Supabase client instance
 * @param query - User's question/message
 * @param options - Configuration options
 * @returns RAGContext with documents and formatted string
 *
 * @example
 * ```ts
 * const context = await retrieveContext(supabase, "What projects use React?");
 * console.log(context.formattedContext);
 * // [PROJECTS]
 * // - "Bonny AI" is built with: React, Next.js, TypeScript...
 * ```
 */
export async function retrieveContext(
    supabase: SupabaseClient,
    query: string,
    options: RAGOptions = {}
): Promise<RAGContext> {
    try {
        // Generate embedding for the query
        const queryEmbedding = await generateQueryEmbedding(query);

        // Retrieve matching documents
        const documents = await matchDocuments(supabase, queryEmbedding, options);

        // Format for LLM consumption
        const { formatted, truncated } = formatContext(
            documents,
            options.maxChars || CONFIG.MAX_CONTEXT_CHARS
        );

        return {
            documents,
            formattedContext: formatted,
            totalChars: formatted.length,
            truncated,
        };
    } catch (error) {
        console.error('RAG retrieveContext error:', error);

        // Return empty context on error (graceful degradation)
        return {
            documents: [],
            formattedContext: '',
            totalChars: 0,
            truncated: false,
        };
    }
}

/**
 * Check if RAG is available
 * HuggingFace works without API key (with rate limits), so RAG is always available
 */
export function isRAGAvailable(): boolean {
    return true; // HuggingFace Inference API works without API key
}

/**
 * Extract keywords from a query for hybrid search fallback
 * Simple extraction - pulls capitalized words and quoted phrases
 */
export function extractSearchTerms(query: string): string | null {
    // Extract quoted phrases
    const quoted = query.match(/"([^"]+)"/g);
    if (quoted && quoted.length > 0) {
        return quoted[0].replace(/"/g, '');
    }

    // Extract capitalized words (likely proper nouns like "React", "Supabase")
    const properNouns = query.match(/\b[A-Z][a-z]+(?:\.[a-z]+)?\b/g);
    if (properNouns && properNouns.length > 0) {
        return properNouns[0];
    }

    return null;
}

/**
 * Smart context retrieval that combines keyword extraction with semantic search
 */
export async function retrieveContextSmart(
    supabase: SupabaseClient,
    query: string,
    options: RAGOptions = {}
): Promise<RAGContext> {
    // Extract potential search terms for hybrid search
    const searchTerm = extractSearchTerms(query);

    return retrieveContext(supabase, query, {
        ...options,
        searchTerm: searchTerm || options.searchTerm,
    });
}
