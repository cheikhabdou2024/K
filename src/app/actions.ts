'use server';
import { mockFeedItems, type FeedItem } from '@/lib/mock-data';

export async function getRecommendedFeedAction(): Promise<FeedItem[]> {
    // Pour la démo, retourne simplement les mockFeedItems
    return mockFeedItems;
}
