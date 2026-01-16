import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import config from './index';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(config.gemini_api_key as string);

// Initialize File Manager
export const fileManager = new GoogleAIFileManager(config.gemini_api_key as string);

// Export the specific model instance
// using gemini-2.5-pro for stability
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
