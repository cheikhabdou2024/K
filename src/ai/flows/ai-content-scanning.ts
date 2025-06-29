// src/ai/flows/ai-content-scanning.ts
'use server';

/**
 * @fileOverview An AI-powered content scanning tool that automatically filters out prohibited content.
 *
 * - aiContentScan - A function that handles the content scanning process.
 * - AiContentScanInput - The input type for the aiContentScan function.
 * - AiContentScanOutput - The return type for the aiContentScan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiContentScanInputSchema = z.object({
  content: z
    .string()
    .describe('The content to be scanned, which can be text or a data URI for images/videos/audio.'),
  contentType: z
    .enum(['text', 'image', 'video', 'audio'])
    .describe('The type of the content being scanned.'),
});
export type AiContentScanInput = z.infer<typeof AiContentScanInputSchema>;

const AiContentScanOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the content is safe and does not violate content guidelines.'),
  reason: z
    .string()
    .optional()
    .describe('The reason why the content is considered unsafe, if applicable.'),
  categoryScores: z
    .record(z.number())
    .optional()
    .describe('Category scores representing the likelihood of different types of harmful content.'),
});
export type AiContentScanOutput = z.infer<typeof AiContentScanOutputSchema>;

export async function aiContentScan(input: AiContentScanInput): Promise<AiContentScanOutput> {
  return aiContentScanFlow(input);
}

const safetyConfig = {
  safetySettings: [
    {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
    {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE'},
    {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
    {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
    {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
  ],
};

const basePrompt = `You are an AI content moderator for a social video app. Your goal is to keep the community safe and welcoming. Analyze the content based on the following strict guidelines and determine if it should be blocked.

Your output MUST be a JSON object with 'isSafe' (boolean) and 'reason' (string, optional).

**Guidelines (Set 'isSafe' to false for these):**
- **Hate Speech & Harassment**: Any content that promotes discrimination, disparages, or harasses on the basis of race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics. This includes direct insults, personal attacks, and threats (e.g., "I hate you," "you are stupid", "fuck you").
- **Adult & Sexually Explicit Content**: No nudity, sexually suggestive, or explicit material.
- **Dangerous Content**: No promotion of dangerous acts, self-harm, or violence.

Analyze the following content. If it clearly violates these rules, set 'isSafe' to false and provide a specific reason. For all other content, including edgy humor or mild critiques that do not cross into harassment, set 'isSafe' to true.`;

const aiTextScanPrompt = ai.definePrompt({
  name: 'aiTextScanPrompt',
  input: {schema: z.object({content: z.string()})},
  output: {schema: AiContentScanOutputSchema},
  prompt: `${basePrompt}\n\nContent to analyze:\n"{{{content}}}"`,
  config: safetyConfig,
});

const aiNonTextScanPrompt = ai.definePrompt({
  name: 'aiNonTextScanPrompt',
  input: {schema: z.object({content: z.string()})},
  output: {schema: AiContentScanOutputSchema},
  prompt: `${basePrompt}\n\nAnalyze the following media content: {{media url=content}}`,
  config: safetyConfig,
});


const aiContentScanFlow = ai.defineFlow(
  {
    name: 'aiContentScanFlow',
    inputSchema: AiContentScanInputSchema,
    outputSchema: AiContentScanOutputSchema,
  },
  async input => {
    try {
      if (input.contentType === 'text') {
        const {output} = await aiTextScanPrompt({ content: input.content });
        // If the model's safety settings are triggered, the output will be null.
        // We must handle this case to ensure we correctly flag the content as unsafe.
        if (!output) {
            return { isSafe: false, reason: "This comment was blocked by our safety filters for potential harassment or hate speech." };
        }
        return output;
      } else {
        const {output} = await aiNonTextScanPrompt({ content: input.content });
         if (!output) {
            return { isSafe: false, reason: "This content violates our community guidelines." };
        }
        return output;
      }
    } catch (error) {
      // If the model throws an error (e.g., due to a safety block), we can inspect it.
      // For simplicity, we'll treat any processing error as a safety failure.
      console.error("Error during content scan flow, likely due to safety settings:", error);
      return { isSafe: false, reason: "This content was blocked by our safety filters." };
    }
  }
);
