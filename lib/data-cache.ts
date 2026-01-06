/**
 * Simple in-memory cache for client-side data fetching.
 * Prevents duplicate API calls when multiple instances of the same component mount.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

// In-flight request tracking to deduplicate concurrent requests
const inFlightRequests = new Map<string, Promise<any>>();

// Data cache with timestamps
const cache = new Map<string, CacheEntry<any>>();

// Default TTL: 5 minutes (data doesn't change often)
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Fetch data with caching and request deduplication.
 *
 * @param key - Unique cache key for this data
 * @param fetcher - Async function that fetches the data
 * @param ttl - Time-to-live in milliseconds (default: 5 minutes)
 * @returns The cached or freshly fetched data
 */
export async function fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = DEFAULT_TTL
): Promise<T> {
    // Check if we have valid cached data
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
    }

    // Check if there's already an in-flight request for this key
    const inFlight = inFlightRequests.get(key);
    if (inFlight) {
        return inFlight;
    }

    // Create new request and track it
    const request = fetcher().then((data) => {
        // Cache the result
        cache.set(key, { data, timestamp: Date.now() });
        // Remove from in-flight tracking
        inFlightRequests.delete(key);
        return data;
    }).catch((error) => {
        // Remove from in-flight tracking on error
        inFlightRequests.delete(key);
        throw error;
    });

    inFlightRequests.set(key, request);
    return request;
}

/**
 * Invalidate a specific cache entry.
 */
export function invalidateCache(key: string): void {
    cache.delete(key);
}

/**
 * Clear all cached data.
 */
export function clearCache(): void {
    cache.clear();
}

// Pre-defined cache keys for consistency
export const CACHE_KEYS = {
    SKILLS: 'skills',
    PROJECTS: 'projects',
    PROJECTS_BY_CATEGORY: (category: string) => `projects:${category}`,
} as const;
