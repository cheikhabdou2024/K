
'use server';

import { aiContentScan, AiContentScanOutput } from '@/ai/flows/ai-content-scanning';
import { speechToText, SpeechToTextOutput } from '@/ai/flows/ai-speech-to-text-flow';

export async function scanCommentAction(
  content: string
): Promise<AiContentScanOutput> {
  if (!content.trim()) {
    return { isSafe: true };
  }
  
  try {
    const result = await aiContentScan({ content, contentType: 'text' });
    return result;
  } catch (error) {
    console.error('Error during AI content scan:', error);
    // In case of an error, default to safe to not block users unnecessarily.
    // A more robust system might have different fallback logic.
    return { isSafe: true };
  }
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
