import { GoogleGenerativeAI } from '@google/generative-ai';
import config from './index';

const genAI = new GoogleGenerativeAI(config.gemini_api_key as string);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-pro',
});
