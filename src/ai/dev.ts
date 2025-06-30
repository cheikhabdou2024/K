import { config } from 'dotenv';
config();

import '@/ai/flows/ai-content-scanning.ts';
import '@/ai/flows/ai-search-flow.ts';
import '@/ai/flows/ai-recommendation-flow.ts';
import '@/ai/flows/ai-speech-to-text-flow.ts';
import '@/ai/flows/ai-sentiment-analysis-flow.ts';
import '@/ai/flows/ai-text-to-speech-flow.ts';
