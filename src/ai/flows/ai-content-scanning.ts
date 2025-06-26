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
    .describe('The content to be scanned, which can be text or a data URI for images/videos.'),
  contentType: z
    .enum(['text', 'image', 'video'])
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

const aiContentScanPrompt = ai.definePrompt({
  name: 'aiContentScanPrompt',
  input: {schema: AiContentScanInputSchema},
  output: {schema: AiContentScanOutputSchema},
  prompt: `You are an AI content moderation tool. Your task is to determine if the given content is safe for all users.

  Here are the content guidelines:
  - No adult content or sexually explicit material.
  - No harassment, bullying, or targeted abuse.
  - No hate speech, discrimination, or offensive language.
  - No misinformation or false/misleading information.
  - No content promoting dangerous or harmful activities.

  Content Type: {{{contentType}}}
  Content: {{#ifEquals contentType "text"}}{{{content}}}{{else}}{{media url=content}}{{/ifEquals}}

  Based on these guidelines, please analyze the content and determine if it is safe.
  If the content violates any of the guidelines, set isSafe to false and provide a reason. Otherwise, set isSafe to true.
  {
    "isSafe": true/false,
    "reason": "reason if isSafe is false, otherwise omit",
    "categoryScores": { /* Category scores if available, otherwise omit */ }
  }

  Consider the following safety settings:
  - HARM_CATEGORY_HATE_SPEECH: BLOCK_ONLY_HIGH
  - HARM_CATEGORY_SEXUALLY_EXPLICIT: BLOCK_LOW_AND_ABOVE
  - HARM_CATEGORY_HARASSMENT: BLOCK_MEDIUM_AND_ABOVE
  - HARM_CATEGORY_DANGEROUS_CONTENT: BLOCK_NONE
  - HARM_CATEGORY_CIVIC_INTEGRITY: BLOCK_ONLY_HIGH`,
  config: {
    safetySettings: [
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH'},
    ],
  },
});

const aiContentScanFlow = ai.defineFlow(
  {
    name: 'aiContentScanFlow',
    inputSchema: AiContentScanInputSchema,
    outputSchema: AiContentScanOutputSchema,
  },
  async input => {
    const {output} = await aiContentScanPrompt(input);
    return output!;
  }
);

// Handlebars equality helper function
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

// Declare Handlebars type to avoid typescript errors
declare global {
  var Handlebars: any;
}

