'use server';
/**
 * @fileOverview An AI-powered speech-to-text transcription service.
 *
 * - speechToText - A function that handles audio transcription.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audioDataUri: z.string().describe("The audio to be transcribed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  transcription: z.string().describe("The transcribed text from the audio."),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;


export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
    return speechToTextFlow(input);
}

const prompt = ai.definePrompt({
    name: 'transcribeAudioPrompt',
    input: {schema: SpeechToTextInputSchema},
    output: {schema: SpeechToTextOutputSchema},
    prompt: `Transcribe the following audio recording accurately. The output should only be the transcribed text.
Audio: {{media url=audioDataUri}}`,
    model: 'googleai/gemini-1.5-flash-latest',
});

const speechToTextFlow = ai.defineFlow(
    {
        name: 'speechToTextFlow',
        inputSchema: SpeechToTextInputSchema,
        outputSchema: SpeechToTextOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        
        return {
            transcription: output?.transcription ?? '',
        };
    }
);
