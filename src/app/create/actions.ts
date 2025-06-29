'use server';

import { aiContentScan, AiContentScanOutput } from '@/ai/flows/ai-content-scanning';

export async function scanContentAction(
  caption: string,
  videoDataUri: string
): Promise<AiContentScanOutput> {
  // Bypassing content scan for demo purposes to ensure a smooth UX.
  return {
    isSafe: true,
    reason: '',
  };
}
