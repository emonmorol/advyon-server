import { GoogleGenerativeAI } from '@google/generative-ai';
import config from './index';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(config.gemini_api_key as string);

// Export the specific model instance
// using gemini-1.5-flash for high rate limits (free tier) and speed
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
