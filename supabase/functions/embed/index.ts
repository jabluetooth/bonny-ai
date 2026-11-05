// Supabase Edge Function: text -> 384-dim embedding using the built-in
// gte-small model. Runs inside Supabase, so there is no third-party API key
// or per-call billing. Used by lib/embeddings.ts (indexing + chat search).
//
// Deploy:   npx supabase functions deploy embed --no-verify-jwt
// Secret:   npx supabase secrets set EMBED_FUNCTION_SECRET=<same value as .env.local>
//
// JWT verification is off because callers authenticate with the shared
// secret below instead (the project's new-style secret keys aren't JWTs).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAX_INPUTS = 64;
const MAX_CHARS = 8000;

const session = new Supabase.ai.Session("gte-small");

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

Deno.serve(async (req) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const secret = Deno.env.get("EMBED_FUNCTION_SECRET");
    if (!secret || req.headers.get("x-embed-secret") !== secret) {
        return json({ error: "Unauthorized" }, 401);
    }

    let body: { input?: unknown };
    try {
        body = await req.json();
    } catch {
        return json({ error: "Invalid JSON" }, 400);
    }

    const inputs = Array.isArray(body.input) ? body.input : [body.input];
    if (
        inputs.length === 0 ||
        inputs.length > MAX_INPUTS ||
        !inputs.every((t) => typeof t === "string" && t.trim().length > 0 && t.length <= MAX_CHARS)
    ) {
        return json({ error: `input must be 1-${MAX_INPUTS} non-empty strings of at most ${MAX_CHARS} chars` }, 400);
    }

    try {
        const embeddings: number[][] = [];
        for (const text of inputs as string[]) {
            const vector = await session.run(text, { mean_pool: true, normalize: true });
            embeddings.push(Array.from(vector as number[]));
        }
        return json({ embeddings });
    } catch (error) {
        console.error("embed error:", error);
        return json({ error: "Embedding failed" }, 500);
    }
});
