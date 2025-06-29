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
    {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE'},
    {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE'},
    {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE'},
    {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
    {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
  ],
};

const basePrompt = `You are a strict AI content moderation engine. Your primary function is to analyze content and determine if it violates community guidelines. You must be extremely strict and flag any content that is even remotely offensive, hateful, harassing, or sexually explicit.

Your output MUST be a JSON object with 'isSafe' (boolean) and 'reason' (string, optional).

Here are the guidelines:
- **Zero Tolerance for Hate Speech & Harassment**: Any form of hate speech, discrimination, personal attacks, insults, or harassment is strictly prohibited. This includes phrases like "fuck you".
- **No Adult Content**: No sexually explicit material, nudity, or suggestive content.
- **No Dangerous Content**: No promotion of dangerous acts, self-harm, or violence.

Analyze the following content. If it violates ANY of these rules, you MUST set 'isSafe' to false and provide a specific reason. Otherwise, set 'isSafe' to true.
`;

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
            return { isSafe: false, reason: "This comment violates our community guidelines for harassment or hate speech." };
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
