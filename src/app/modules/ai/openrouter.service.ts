import httpStatus from 'http-status';
import { openRouterConfig, OPENROUTER_MODEL } from '../../config/openrouter.config';
import { TAiAnalysis, TDocumentCategory } from '../document/document.interface';
import { TChatHistory } from './ai.interface';

// Valid document categories
const VALID_CATEGORIES: TDocumentCategory[] = [
  'Affidavit',
  'Evidence',
  'Contract',
  'Court Filing',
  'Correspondence',
  'Legal Brief',
  'Pleading',
  'Discovery',
  'Motion',
  'Order',
  'Judgment',
  'Settlement',
  'Other',
];

// Default/fallback AI analysis result
const DEFAULT_AI_ANALYSIS: TAiAnalysis = {
  summary: {
    refined: 'Unable to analyze document content.',
    raw: 'Unable to analyze document content.',
  },
  extractedEntities: [],
  documentCategory: 'Other',
  confidenceScore: 0,
  analyzedAt: new Date(),
  modelVersion: OPENROUTER_MODEL,
};

// Singleton instance holder
let openRouterClient: any = null;

/**
 * Dynamically import and initialize the OpenRouter client
 * This is needed because @openrouter/sdk is an ES Module and we are in a CommonJS environment
 */
const getOpenRouterClient = async () => {
  if (openRouterClient) return openRouterClient;

  try {
    // Dynamic import - using eval to bypass TypeScript compiling to require()
    // This is necessary because the project is CJS but the SDK is ESM-only
    const { OpenRouter } = await (eval('import("@openrouter/sdk")') as Promise<any>);
    
    openRouterClient = new OpenRouter({
      apiKey: openRouterConfig.apiKey,
    });

    return openRouterClient;
  } catch (error) {
    console.error('Failed to initialize OpenRouter client:', error);
    throw new Error('AI Service Unavailable: Failed to load OpenRouter SDK');
  }
};

/**
 * Analyze a legal document using OpenRouter (OpenAI-compatible)
 * @param fileText - The extracted text content from the document
 * @returns AI analysis results with summary, entities, category, and confidence
 */
const analyzeLegalDocument = async (fileText: string): Promise<TAiAnalysis> => {
  // Handle empty or very short text
  if (!fileText || fileText.trim().length < 10) {
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: {
        refined: 'Document contains insufficient text for analysis.',
        raw: 'Document contains insufficient text for analysis.',
      },
    };
  }

  // Truncate very long documents to avoid token limits (OpenRouter models vary in detailed limit, but 30k chars is safe for most)
  const truncatedText =
    fileText.length > 30000 ? fileText.substring(0, 30000) + '...' : fileText;

  const prompt = `You are a legal assistant AI. Analyze the following legal document text and extract key information.

IMPORTANT: Return ONLY a valid JSON object with NO additional text, markdown, or explanation. Do not use markdown code blocks.

The JSON must have this exact structure:
{
  "summary": "A concise 2-3 sentence summary of the document's main purpose and content",
  "extractedEntities": ["entity1", "entity2"],
  "documentCategory": "Category",
  "confidenceScore": 0.95
}

Rules:
- "summary": A clear, professional summary (max 500 characters)
- "extractedEntities": Array of important names (people, organizations), dates (in format "Date: YYYY-MM-DD"), locations, case numbers, law references, and monetary amounts found in the document
- "documentCategory": Must be exactly one of: "Affidavit", "Evidence", "Contract", "Court Filing", "Correspondence", "Legal Brief", "Pleading", "Discovery", "Motion", "Order", "Judgment", "Settlement", "Other"
- "confidenceScore": A number between 0 and 1 indicating your confidence in the analysis

DOCUMENT TEXT:
${truncatedText}

JSON RESPONSE:`;

  try {
    const client = await getOpenRouterClient();
    
    const completion = await client.chat.send({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: false,
    }); // Currently using send which might return a non-promise or completion directly depending on SDK
    
    // Note: The @openrouter/sdk chat.send return type might be different or promise-based. 
    // Usually it returns a promise resolving to the completion object.
    
    // If specific casting is needed due to beta SDK:
    const response = completion as any; 
    
    const responseText = response.choices?.[0]?.message?.content || '';

    // Bulletproof JSON cleaning - remove all markdown formatting
    let cleanedResponse = responseText
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .replace(/^\s*json\s*/i, '') // Remove leading "json" word
      .trim();

    // Try to extract JSON object if there's extra text around it
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    // Parse the JSON response
    const parsedResult = JSON.parse(cleanedResponse);

    // Validate and sanitize the response
    const summaryText = typeof parsedResult.summary === 'string'
          ? parsedResult.summary.substring(0, 1000)
          : DEFAULT_AI_ANALYSIS.summary.refined;

    const analysis: TAiAnalysis = {
      summary: {
        refined: summaryText,
        raw: summaryText, 
      },
      extractedEntities: Array.isArray(parsedResult.extractedEntities)
        ? parsedResult.extractedEntities
            .filter((e: unknown) => typeof e === 'string')
            .slice(0, 50)
        : [],
      documentCategory: VALID_CATEGORIES.includes(parsedResult.documentCategory)
        ? parsedResult.documentCategory
        : 'Other',
      confidenceScore:
        typeof parsedResult.confidenceScore === 'number' &&
        parsedResult.confidenceScore >= 0 &&
        parsedResult.confidenceScore <= 1
          ? parsedResult.confidenceScore
          : 0.5,
      analyzedAt: new Date(),
      modelVersion: OPENROUTER_MODEL,
    };

    return analysis;
  } catch (error) {
    // Log the error for debugging
    console.error('OpenRouter AI analysis error:', error);

    // Return fallback object instead of throwing
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: {
        refined: error instanceof SyntaxError
          ? 'Failed to parse AI response. Document may require manual review.'
          : 'AI analysis encountered an error. Please try again later.',
        raw: '',
      },
    };
  }
};

/**
 * Process chat message using OpenRouter
 */
const processChat = async (message: string, history: TChatHistory[], context?: string): Promise<string> => {
    try {
        const messages: any[] = [];
        
        // Add system/context message
        if (context) {
            messages.push({
                role: 'system',
                content: context
            });
        } else {
             messages.push({
                role: 'system',
                content: 'You are a helpful legal assistant.'
            });
        }

        // Add history
        history.forEach(msg => {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        });

        // Add current message
        messages.push({
            role: 'user',
            content: message
        });

        const client = await getOpenRouterClient();

        const completion = await client.chat.send({
            model: OPENROUTER_MODEL,
            messages: messages,
            stream: false
        });

        const response = completion as any;
        return response.choices?.[0]?.message?.content || 'No response generated.';

    } catch (error) {
        console.error('OpenRouter Chat error:', error);
        throw new Error('Failed to process chat message');
    }
}

export const OpenRouterService = {
  analyzeLegalDocument,
  processChat
};
