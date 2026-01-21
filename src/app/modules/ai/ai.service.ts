/* eslint-disable @typescript-eslint/no-var-requires */
import { groqClient, AI_MODEL as GROQ_MODEL } from '../../config/groq.config';
import { geminiAI, GEMINI_MODEL, DOCUMENT_ANALYSIS_SCHEMA, isGeminiAvailable } from '../../config/gemini.config';
import { TAiAnalysis, TDocumentCategory } from '../document/document.interface';

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
  summary: 'Unable to analyze document content.',
  rawSummary: '',
  keyPoints: [],
  extractedEntities: [],
  legalRefs: [],
  suggestions: [],
  documentCategory: 'Other',
  confidenceScore: 0,
  analyzedAt: new Date(),
  modelVersion: 'gemini-2.0-flash',
};

// Legal document analysis prompt
const LEGAL_ANALYSIS_PROMPT = `You are an expert legal document analyzer. Analyze the provided document thoroughly.

Your task:
1. Read and understand the entire document content (text and any visual elements)
2. Identify the document type/category from: ${VALID_CATEGORIES.join(', ')}
3. Extract key information, entities, and legal references
4. Provide a professional summary and actionable suggestions

Be thorough and accurate. This is a legal document that requires careful analysis.
If the document is unclear or you cannot read it properly, provide a low confidence score.`;

// Helper for retry logic
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.code === 429 || error?.response?.status === 429)) {
      console.warn(`Rate limit hit, retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Analyze a document using Gemini Vision
 * SIMPLE: Pass file buffer → Gemini reads it directly → Returns analysis
 */
const analyzeWithGemini = async (buffer: Buffer, mimeType: string): Promise<TAiAnalysis> => {
  if (!geminiAI) {
    throw new Error('Gemini AI not initialized - check GEMINI_API_KEY in .env');
  }

  console.log(`[Gemini] Starting vision analysis. MIME: ${mimeType}, Size: ${buffer.length} bytes`);

  const base64Data = buffer.toString('base64');

  const response = await withRetry(() => 
    geminiAI!.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: LEGAL_ANALYSIS_PROMPT }
        ]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: DOCUMENT_ANALYSIS_SCHEMA
      }
    })
  );

  const responseText = response.text;
  console.log(`[Gemini] Response received. Length: ${responseText?.length || 0}`);

  if (!responseText) {
    throw new Error('Empty response from Gemini');
  }

  const parsedResult = JSON.parse(responseText);

  const analysis: TAiAnalysis = {
    summary: parsedResult.summary || DEFAULT_AI_ANALYSIS.summary,
    rawSummary: parsedResult.rawSummary || '',
    keyPoints: Array.isArray(parsedResult.keyPoints) ? parsedResult.keyPoints : [],
    extractedEntities: Array.isArray(parsedResult.extractedEntities) ? parsedResult.extractedEntities : [],
    legalRefs: Array.isArray(parsedResult.legalRefs) ? parsedResult.legalRefs : [],
    suggestions: Array.isArray(parsedResult.suggestions) ? parsedResult.suggestions : [],
    documentCategory: VALID_CATEGORIES.includes(parsedResult.documentCategory)
      ? parsedResult.documentCategory
      : 'Other',
    confidenceScore: typeof parsedResult.confidenceScore === 'number' 
      ? Math.min(1, Math.max(0, parsedResult.confidenceScore)) 
      : 0.5,
    analyzedAt: new Date(),
    modelVersion: GEMINI_MODEL,
  };

  console.log(`[Gemini] ✅ Analysis complete. Category: ${analysis.documentCategory}, Confidence: ${analysis.confidenceScore}`);
  return analysis;
};

/**
 * Main document analysis function
 * Uses Gemini Vision to read files directly
 */
const analyzeLegalDocument = async (
  _fileText: string,  // Ignored - kept for backward compatibility
  buffer?: Buffer, 
  mimeType?: string
): Promise<TAiAnalysis> => {
  console.log(`[AI Service] analyzeLegalDocument called. Buffer: ${buffer?.length || 0} bytes`);

  if (!buffer || !mimeType) {
    console.error('[AI Service] No buffer or mimeType provided');
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: 'No file content provided for analysis.',
    };
  }

  // Use Gemini Vision
  if (isGeminiAvailable()) {
    try {
      return await analyzeWithGemini(buffer, mimeType);
    } catch (error: any) {
      console.error('[AI Service] Gemini analysis failed:', error.message);
      return {
        ...DEFAULT_AI_ANALYSIS,
        summary: `Analysis failed: ${error.message}. Please check your GEMINI_API_KEY.`,
      };
    }
  }

  // No AI available
  console.error('[AI Service] No AI provider available');
  return {
    ...DEFAULT_AI_ANALYSIS,
    summary: 'AI service unavailable. Please configure GEMINI_API_KEY in .env',
  };
};

/**
 * Chat with AI about a document (Uses Groq)
 */
const chatWithAI = async (message: string, context: string, history: any[] = []): Promise<string> => {
  try {
    const systemPrompt = `You are an expert legal assistant named Advyon AI.
    ${context ? `CONTEXT (Use this to answer): \n${context}` : ''}
    
    Answer the user's question clearly and professionally. Cite the context where possible.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((msg: any) => ({ 
        role: msg.role === 'user' ? 'user' : 'assistant', 
        content: msg.content 
      })),
      { role: 'user', content: message }
    ];

    const completion = await withRetry(() => groqClient.chat.completions.create({
      messages: messages as any,
      model: GROQ_MODEL,
    }));

    return completion.choices[0]?.message?.content || "I couldn't generate a response.";
  } catch (error) {
    console.error('Groq chat error:', error);
    return "I'm having trouble processing your request right now. Please try again.";
  }
};

export const AIService = {
  analyzeLegalDocument,
  analyzeWithGemini,
  chatWithAI,
  isGeminiAvailable,
};
