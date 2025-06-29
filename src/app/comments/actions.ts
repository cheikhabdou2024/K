
'use server';

import { AiContentScanOutput } from '@/ai/flows/ai-content-scanning';
import { speechToText, SpeechToTextOutput } from '@/ai/flows/ai-speech-to-text-flow';

export async function scanCommentAction(
  content: string
): Promise<AiContentScanOutput> {
  // Bypassing content scan for now, as requested.
  // We will re-implement this feature later.
  return { isSafe: true };
}

export async function transcribeAudioAction(
  audioDataUri: string
): Promise<SpeechToTextOutput> {
  if (!audioDataUri) {
    return { transcription: '' };
  }
  try {
    const result = await speechToText({ audioDataUri });
    return result;
  } catch (error) {
    console.error('Error during AI transcription:', error);
    // In case of an error, return an empty transcription to avoid breaking the UI
    return { transcription: '' };
  }
}
