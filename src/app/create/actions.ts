'use server';

import { aiContentScan, AiContentScanOutput } from '@/ai/flows/ai-content-scanning';

export async function scanContentAction(caption: string): Promise<AiContentScanOutput> {
  try {
    const result = await aiContentScan({
      content: caption,
      contentType: 'text',
    });
    return result;
  } catch (error) {
    console.error('Error scanning content:', error);
    return {
      isSafe: false,
      reason: 'An unexpected error occurred during content moderation.',
    };
  }
}
