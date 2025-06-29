'use server';
/**
 * @fileOverview An AI-powered recommendation engine for the video feed.
 *
 * - getRecommendations - A function that returns a personalized video feed.
 * - RecommendationInput - The input type for the getRecommendations function.
 * - RecommendationOutput - The return type for the getRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { mockFeedItems, type FeedItem } from '@/lib/mock-data';

const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    avatarUrl: z.string(),
});
const SoundSchema = z.object({
    id: z.string(),
    title: z.string(),
});
const FeedItemSchema = z.object({
    id: z.string(),
    user: UserSchema,
    videoUrl: z.string(),
    thumbnailUrl: z.string(),
    caption: z.string(),
    sound: SoundSchema,
    likes: z.number(),
    comments: z.number(),
    shares: z.number(),
    isLiked: z.boolean().optional(),
    createdAt: z.any(),
});

const RecommendationInputSchema = z.object({
    allItems: z.array(FeedItemSchema),
});
export type RecommendationInput = z.infer<typeof RecommendationInputSchema>;

const RecommendationOutputSchema = z.object({
  recommendations: z.array(FeedItemSchema).describe('An array of recommended feed items, ranked from most to least recommended.'),
});
export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>;


export async function getRecommendations(): Promise<RecommendationOutput> {
  // In a real app, you'd fetch user history to personalize this.
  // For this demo, we pass the entire mock data set to the model for ranking.
  return recommendationFlow({ allItems: mockFeedItems });
}

const recommendationPrompt = ai.definePrompt({
  name: 'recommendationPrompt',
  input: { schema: RecommendationInputSchema },
  output: { schema: RecommendationOutputSchema },
  prompt: `You are a sophisticated recommendation engine for a short-form video app called FlipTok.
Your task is to act as the "For You" page algorithm. Analyze the provided list of all available videos and rank them based on what you think would be most engaging to a general audience.

Consider a mix of factors:
- Virality: Videos with catchy captions or related to trends.
- Engagement metrics: Higher likes, comments, and shares are a strong signal.
- Content quality: Analyze the caption to infer the quality and appeal of the video.

Return a JSON object with a "recommendations" key, containing an array of the full video objects. The results should be ordered from most to least recommended to create an exciting and engaging feed for the user. Do not simply sort by likes; use a holistic approach.

Available Videos (JSON):
{{{json allItems}}}
`,
});


const recommendationFlow = ai.defineFlow(
  {
    name: 'recommendationFlow',
    inputSchema: RecommendationInputSchema,
    outputSchema: RecommendationOutputSchema,
  },
  async (input) => {
      const { output } = await recommendationPrompt(input);
      return output || { recommendations: [] };
  }
);
