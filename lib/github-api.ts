/**
 * Shared GitHub REST API helpers for the content agent — reading repo
 * files (README/package.json) and writing repo metadata (description,
 * topics). Used by app/api/webhooks/github/route.ts and lib/agent-session.ts.
 */

function githubHeaders(accept = 'application/vnd.github+json'): HeadersInit {
    const token = process.env.GITHUB_TOKEN
    return {
        Accept: accept,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export async function fetchRepoFile(repoFullName: string, ref: string, path: string): Promise<string | null> {
    try {
        const res = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents/${path}?ref=${encodeURIComponent(ref)}`,
            { headers: githubHeaders() }
        )
        if (!res.ok) return null
        const data = await res.json()
        if (data.encoding === 'base64' && typeof data.content === 'string') {
            return Buffer.from(data.content, 'base64').toString('utf-8')
        }
        return null
    } catch (error) {
        console.error(`[github-api] failed fetching ${path} from ${repoFullName}:`, error)
        return null
    }
}

export interface RepoMetadata {
    description: string | null
    topics: string[]
}

export async function getRepoMetadata(repoFullName: string): Promise<RepoMetadata | null> {
    try {
        const res = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers: githubHeaders() })
        if (!res.ok) return null
        const data = await res.json()
        return { description: data.description ?? null, topics: Array.isArray(data.topics) ? data.topics : [] }
    } catch (error) {
        console.error(`[github-api] failed fetching repo metadata for ${repoFullName}:`, error)
        return null
    }
}

/**
 * GitHub topic slugs: lowercase, alphanumeric + hyphens only, max 35 chars
 * each, max 20 per repo. Normalizes best-effort — the API still validates
 * and would 422 on anything left invalid after this.
 */
export function normalizeTopics(topics: string[]): string[] {
    const seen = new Set<string>()
    const normalized: string[] = []

    for (const raw of topics) {
        const slug = raw
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 35)

        if (slug && !seen.has(slug)) {
            seen.add(slug)
            normalized.push(slug)
        }
        if (normalized.length >= 20) break
    }

    return normalized
}

interface UpdateRepoMetadataInput {
    description?: string
    topics?: string[]
}

interface FieldResult {
    ok: boolean
    error?: string
    applied?: string[]
}

export interface UpdateRepoMetadataResult {
    description?: FieldResult
    topics?: FieldResult
}

/**
 * Sets the GitHub repo's own description and/or topics. Requires a token
 * with "Administration" (read and write) permission — Contents:Read alone
 * (used for fetchRepoFile) is not enough for these two write endpoints.
 */
export async function updateRepoMetadata(
    repoFullName: string,
    input: UpdateRepoMetadataInput
): Promise<UpdateRepoMetadataResult> {
    const result: UpdateRepoMetadataResult = {}

    if (input.description !== undefined) {
        try {
            const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
                method: 'PATCH',
                headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: input.description }),
            })
            result.description = res.ok
                ? { ok: true }
                : { ok: false, error: `${res.status}: ${(await res.text()).slice(0, 300)}` }
        } catch (error) {
            result.description = { ok: false, error: String(error) }
        }
    }

    if (input.topics !== undefined) {
        const topics = normalizeTopics(input.topics)
        try {
            const res = await fetch(`https://api.github.com/repos/${repoFullName}/topics`, {
                method: 'PUT',
                headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ names: topics }),
            })
            result.topics = res.ok
                ? { ok: true, applied: topics }
                : { ok: false, error: `${res.status}: ${(await res.text()).slice(0, 300)}` }
        } catch (error) {
            result.topics = { ok: false, error: String(error) }
        }
    }

    return result
}
