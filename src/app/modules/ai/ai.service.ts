/* eslint-disable @typescript-eslint/no-var-requires */
import { groqClient, AI_MODEL as GROQ_MODEL } from '../../config/groq.config';
import { openrouterClient, OPENROUTER_VISION_MODEL, isOpenRouterAvailable } from '../../config/openrouter.config';
import { TAiAnalysis, TDocumentCategory } from '../document/document.interface';

// Valid document categories
const VALID_CATEGORIES: TDocumentCategory[] = [
  'Affidavit', 'Evidence', 'Contract', 'Court Filing', 'Correspondence',
  'Legal Brief', 'Pleading', 'Discovery', 'Motion', 'Order', 'Judgment', 'Settlement', 'Other',
];

// Default analysis result
const DEFAULT_AI_ANALYSIS: TAiAnalysis = {
  summary: 'Unable to analyze document content.',
  rawSummary: '',
  keyPoints: [],
  extractedEntities: [],
  legalRefs: [],
  suggestions: [],
  documentCategory: 'Other',
  confidenceScore: 0,
  analyzedAt: new Date(),
  modelVersion: 'openrouter',
};

const LEGAL_ANALYSIS_PROMPT = `You are an expert legal document analyzer. Analyze this document and return a JSON response with:
{
  "summary": "2-3 paragraph professional summary",
  "rawSummary": "Detailed markdown explanation",
  "keyPoints": ["point 1", "point 2"],
  "extractedEntities": [{"name": "Entity", "type": "person/org/date", "count": 1}],
  "legalRefs": [{"citation": "Law Name", "description": "desc", "relevance": "high/medium/low"}],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "documentCategory": "One of: ${VALID_CATEGORIES.join(', ')}",
  "confidenceScore": 0.85
}

Be thorough and accurate. Return ONLY valid JSON.`;

/**
 * Analyze document using OpenRouter (Primary - FREE)
 * Uses Gemini 2.0 Flash via OpenRouter with vision capabilities
 */
const analyzeWithOpenRouter = async (buffer: Buffer, mimeType: string): Promise<TAiAnalysis> => {
  if (!openrouterClient) {
    throw new Error('OpenRouter not configured - check OPENROUTER_API_KEY');
  }

  console.log(`[OpenRouter] Starting analysis. MIME: ${mimeType}, Size: ${buffer.length} bytes`);

  const base64Data = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const response = await openrouterClient.chat.completions.create({
    model: OPENROUTER_VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: LEGAL_ANALYSIS_PROMPT }
        ]
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  });

  const responseText = response.choices[0]?.message?.content || '{}';
  console.log(`[OpenRouter] Response received. Length: ${responseText.length}`);

  // Parse JSON response
  let parsedResult;
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch (e) {
    console.error('[OpenRouter] Failed to parse JSON:', e);
    parsedResult = {};
  }

  const analysis: TAiAnalysis = {
    summary: parsedResult.summary || DEFAULT_AI_ANALYSIS.summary,
    rawSummary: parsedResult.rawSummary || '',
    keyPoints: Array.isArray(parsedResult.keyPoints) ? parsedResult.keyPoints : [],
    extractedEntities: Array.isArray(parsedResult.extractedEntities) ? parsedResult.extractedEntities : [],
    legalRefs: Array.isArray(parsedResult.legalRefs) ? parsedResult.legalRefs : [],
    suggestions: Array.isArray(parsedResult.suggestions) ? parsedResult.suggestions : [],
    documentCategory: VALID_CATEGORIES.includes(parsedResult.documentCategory)
      ? parsedResult.documentCategory : 'Other',
    confidenceScore: typeof parsedResult.confidenceScore === 'number'
      ? Math.min(1, Math.max(0, parsedResult.confidenceScore)) : 0.5,
    analyzedAt: new Date(),
    modelVersion: OPENROUTER_VISION_MODEL,
  };

  console.log(`[OpenRouter] ✅ Analysis complete. Category: ${analysis.documentCategory}, Confidence: ${analysis.confidenceScore}`);
  return analysis;
};

/**
 * Main document analysis function
 * Priority: OpenRouter (free) → Fallback error
 */
const analyzeLegalDocument = async (
  _fileText: string,
  buffer?: Buffer,
  mimeType?: string
): Promise<TAiAnalysis> => {
  console.log(`[AI Service] analyzeLegalDocument called. Buffer: ${buffer?.length || 0} bytes`);

  if (!buffer || !mimeType) {
    return { ...DEFAULT_AI_ANALYSIS, summary: 'No file content provided.' };
  }

  // Use OpenRouter (FREE)
  if (isOpenRouterAvailable()) {
    try {
      return await analyzeWithOpenRouter(buffer, mimeType);
    } catch (error: any) {
      console.error('[AI Service] OpenRouter failed:', error.message);
      return { ...DEFAULT_AI_ANALYSIS, summary: `Analysis failed: ${error.message}` };
    }
  }

  return { ...DEFAULT_AI_ANALYSIS, summary: 'No AI provider available. Configure OPENROUTER_API_KEY.' };
};

/**
 * Chat with AI (Uses Groq - fast text chat)
 */
const chatWithAI = async (message: string, context: string, history: any[] = []): Promise<string> => {
  try {
    const systemPrompt = `You are an expert legal assistant named Advyon AI.
    ${context ? `CONTEXT:\n${context}` : ''}
    Answer clearly and professionally.`;

    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map((msg: any) => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content })),
        { role: 'user', content: message }
      ],
      model: GROQ_MODEL,
    });

    return completion.choices[0]?.message?.content || "I couldn't generate a response.";
  } catch (error) {
    console.error('Groq chat error:', error);
    return "I'm having trouble. Please try again.";
  }
};

export const AIService = {
  analyzeLegalDocument,
  analyzeWithOpenRouter,
  chatWithAI,
  isOpenRouterAvailable,
};
