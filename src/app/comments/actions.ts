
'use server';

import { AiContentScanOutput } from '@/ai/flows/ai-content-scanning';
import { generateTextToSpeech, TextToSpeechOutput } from '@/ai/flows/ai-text-to-speech-flow';

export async function scanCommentAction(
  content: string
): Promise<AiContentScanOutput> {
  // Bypassing content scan for now, as requested.
  // We will re-implement this feature later.
  return { isSafe: true };
}


export async function generateTtsAction(
  text: string
): Promise<TextToSpeechOutput> {
  if (!text) {
    return { audioDataUri: '' };
  }
  try {
    const result = await generateTextToSpeech({ text });
    return result;
  } catch (error) {
    console.error('Error during AI TTS generation:', error);
    // In case of an error, return an empty data URI to avoid breaking the UI
    return { audioDataUri: '' };
  }
}
