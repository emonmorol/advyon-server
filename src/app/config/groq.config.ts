import Groq from 'groq-sdk';
import config from './index';

// Initialize Groq client
export const groqClient = new Groq({
  apiKey: config.groq_api_key,
});

// Use Llama 3 70b
export const AI_MODEL = 'llama-3.3-70b-versatile';
