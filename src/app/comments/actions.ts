'use server';

import { aiContentScan, AiContentScanOutput } from '@/ai/flows/ai-content-scanning';

export async function scanCommentAction(
  content: string,
  contentType: 'text' | 'audio'
): Promise<AiContentScanOutput> {
  try {
    const result = await aiContentScan({
      content,
      contentType,
    });

    if (result.isSafe) {
        return { isSafe: true, reason: '' };
    } else {
        return {
          isSafe: false,
          reason: result.reason || 'This comment violates our community guidelines.',
        };
    }

  } catch (error) {
    console.error('Error scanning comment:', error);
    return {
      isSafe: false,
      reason: 'An unexpected error occurred during content moderation.',
    };
  }
}
