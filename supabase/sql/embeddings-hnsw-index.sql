-- Replace the ivfflat vector index with HNSW.
--
-- ivfflat (lists = 100) only probes 1 of 100 clusters per query by default,
-- and its clusters are trained on whatever rows existed when it was built.
-- With a few hundred rows (and vectors from a different model than the ones
-- it was trained on) it silently drops most good matches. HNSW needs no
-- training and keeps near-exact recall at any table size.
drop index if exists public.idx_embeddings_vector;

create index if not exists idx_embeddings_vector_hnsw
    on public.document_embeddings
    using hnsw (embedding extensions.vector_cosine_ops);
