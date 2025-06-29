'use server';
/**
 * @fileOverview An AI-powered sentiment analysis tool for comments.
 *
 * - analyzeSentiment - A function that analyzes the sentiment of a given text.
 * - SentimentAnalysisInput - The input type for the analyzeSentiment function.
 * - SentimentAnalysisOutput - The return type for the analyzeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SentimentAnalysisInputSchema = z.object({
  text: z.string().describe('The text content to analyze.'),
});
export type SentimentAnalysisInput = z.infer<typeof SentimentAnalysisInputSchema>;

const SentimentAnalysisOutputSchema = z.object({
  sentiment: z.enum(['Positive', 'Negative', 'Neutral']).describe('The overall sentiment of the text.'),
  score: z.number().min(-1).max(1).describe('A score from -1 (most negative) to 1 (most positive).'),
  emotions: z.array(z.string()).optional().describe('Key emotions detected in the text (e.g., Joy, Anger, Sadness).'),
});
export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutputSchema>;

export async function analyzeSentiment(input: SentimentAnalysisInput): Promise<SentimentAnalysisOutput> {
  return sentimentAnalysisFlow(input);
}

const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: { schema: SentimentAnalysisInputSchema },
  output: { schema: SentimentAnalysisOutputSchema },
  prompt: `You are an expert in sentiment analysis. Analyze the following text and determine its sentiment.
The sentiment should be one of 'Positive', 'Negative', or 'Neutral'.
Provide a sentiment score from -1.0 (very negative) to 1.0 (very positive).
Also, identify the primary emotions present in the text, if any.

Text to analyze:
"{{{text}}}"
`,
});

const sentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'sentimentAnalysisFlow',
    inputSchema: SentimentAnalysisInputSchema,
    outputSchema: SentimentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await sentimentAnalysisPrompt(input);
    if (!output) {
      // Fallback in case the model fails to produce structured output
      return { sentiment: 'Neutral', score: 0, emotions: [] };
    }
    return output;
  }
);
