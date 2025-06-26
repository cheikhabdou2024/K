'use server';

import { aiContentScan, AiContentScanOutput } from '@/ai/flows/ai-content-scanning';

export async function scanContentAction(
  caption: string,
  videoDataUri: string
): Promise<AiContentScanOutput> {
  try {
    const [textResult, videoResult] = await Promise.all([
      aiContentScan({
        content: caption,
        contentType: 'text',
      }),
      aiContentScan({
        content: videoDataUri,
        contentType: 'video',
      }),
    ]);

    const isSafe = textResult.isSafe && videoResult.isSafe;
    let reason = '';
    if (!textResult.isSafe) {
      reason += `Caption violation: ${textResult.reason || 'Community guidelines violation'}. `;
    }
    if (!videoResult.isSafe) {
      reason += `Video violation: ${videoResult.reason || 'Community guidelines violation'}.`;
    }

    return {
      isSafe,
      reason: reason.trim() || (isSafe ? '' : 'Content violates our community guidelines.'),
    };
  } catch (error) {
    console.error('Error scanning content:', error);
    return {
      isSafe: false,
      reason: 'An unexpected error occurred during content moderation.',
    };
  }
}
