'use server';
/**
 * @fileOverview An AI-powered search agent for video content.
 *
 * - aiSearch - A function that handles the video search process.
 * - AiSearchInput - The input type for the aiSearch function.
 * - AiSearchOutput - The return type for the aiSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { mockFeedItems, type FeedItem } from '@/lib/mock-data';

const AiSearchInputSchema = z.object({
  query: z.string().describe("The user's search query."),
});
export type AiSearchInput = z.infer<typeof AiSearchInputSchema>;

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
})
const AiSearchOutputSchema = z.object({
  results: z.array(FeedItemSchema).describe('An array of relevant feed items, ranked by relevance.'),
});
export type AiSearchOutput = z.infer<typeof AiSearchOutputSchema>;

export async function aiSearch(input: AiSearchInput): Promise<AiSearchOutput> {
  // In a real app, you'd fetch this from a database.
  // For this demo, we pass the entire mock data set to the model.
  return aiSearchFlow({ query: input.query, allItems: mockFeedItems });
}

const aiSearchPrompt = ai.definePrompt({
  name: 'aiSearchPrompt',
  input: { schema: z.object({ query: z.string(), allItems: z.array(FeedItemSchema) }) },
  output: { schema: AiSearchOutputSchema },
  prompt: `You are a powerful semantic search engine for a short-form video app called FlipTok.
Your task is to analyze the user's search query and return the most relevant videos from the provided list of all available videos.
Consider the video's caption, the user's name and username, and even the sound title to determine relevance.

Return a JSON object with a "results" key, containing an array of the full video objects that are a good match for the query.
The results should be ordered from most to least relevant.

User Query: {{{query}}}

Available Videos (JSON):
{{{json allItems}}}
`,
});


const aiSearchFlow = ai.defineFlow(
  {
    name: 'aiSearchFlow',
    inputSchema: z.object({ query: z.string(), allItems: z.array(FeedItemSchema) }),
    outputSchema: AiSearchOutputSchema,
  },
  async (input) => {
      const { output } = await aiSearchPrompt(input);
      return output || { results: [] };
  }
);
