import config from './index';

// Initialize OpenRouter client
export const openRouterConfig = {
  apiKey: config.openrouter_api_key || process.env.OPENROUTER_API_KEY,
};

export const OPENROUTER_MODEL = 'openai/gpt-oss-120b:free';
