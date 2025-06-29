'use server';
import { getRecommendations } from '@/ai/flows/ai-recommendation-flow';
import type { FeedItem } from '@/lib/mock-data';

export async function getRecommendedFeedAction(): Promise<FeedItem[]> {
    try {
        const result = await getRecommendations();
        return result.recommendations;
    } catch (error) {
        console.error("Error during AI recommendation:", error);
        // In case of an error, return an empty array or fallback to a default list
        return [];
    }
}
