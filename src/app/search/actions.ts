'use server';
import { aiSearch } from '@/ai/flows/ai-search-flow';
import type { FeedItem } from '@/lib/mock-data';

export async function searchAction(query: string): Promise<FeedItem[]> {
    if (!query) {
        return [];
    }
    try {
        const result = await aiSearch({ query });
        return result.results;
    } catch (error) {
        console.error("Error during AI search:", error);
        // In case of an error, return an empty array
        return [];
    }
}
