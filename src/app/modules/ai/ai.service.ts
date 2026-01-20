/* eslint-disable @typescript-eslint/no-var-requires */
import mammoth from 'mammoth';
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
 * Analyze a document using Gemini Vision (Primary)
 * Directly reads PDFs and images - no text extraction needed
 */
const analyzeWithGeminiVision = async (buffer: Buffer, mimeType: string): Promise<TAiAnalysis> => {
  if (!geminiAI) {
    throw new Error('Gemini AI not initialized - API key missing');
  }

  console.log(`[Gemini] Starting vision analysis. MIME: ${mimeType}, Size: ${buffer.length} bytes`);

  // Convert buffer to base64 for inline data
  const base64Data = buffer.toString('base64');

  try {
    const response = await withRetry(() => 
      geminiAI!.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{
          role: 'user',
          parts: [
            { 
              inlineData: { 
                mimeType: mimeType, 
                data: base64Data 
              } 
            },
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

    // Validate and sanitize the response
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

    console.log(`[Gemini] Analysis complete. Category: ${analysis.documentCategory}, Confidence: ${analysis.confidenceScore}`);
    return analysis;

  } catch (error: any) {
    console.error('[Gemini] Vision analysis error:', error);
    throw error;
  }
};

/**
 * Fallback: Analyze using Groq with text extraction
 * Used when Gemini is unavailable or fails
 */
const analyzeWithGroqFallback = async (fileText: string): Promise<TAiAnalysis> => {
  console.log(`[Groq Fallback] Starting text analysis. Text length: ${fileText?.length || 0}`);

  if (!fileText || fileText.length < 50) {
    console.log('[Groq Fallback] Error: Insufficient text for analysis');
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: 'Document content is empty or unreadable. Please upload a clear text-based document.',
      confidenceScore: 0
    };
  }

  const promptInstructions = `You are an expert legal aide. Analyze the provided legal document text and output structured JSON.
  
  You must strictly follow this JSON schema:
  {
    "summary": "Professional executive summary (2-3 paragraphs)",
    "rawSummary": "Detailed markdown explanation of contents",
    "keyPoints": ["point 1", "point 2", ...],
    "extractedEntities": [{ "name": "Entity Name", "type": "person/organization/date/location/amount", "count": 1, "mentions": ["context sentence"] }],
    "legalRefs": [{ "citation": "Law Name", "description": "desc", "relevance": "high/medium/low" }],
    "suggestions": ["Suggestion 1 specifically for this case", "Suggestion 2..."],
    "documentCategory": "One of: ${VALID_CATEGORIES.join(', ')}",
    "confidenceScore": 0.95
  }

  If the document is too short or unclear, give a low confidence score but still try to categorize it.
  
  DOCUMENT CONTENT:
  ${fileText?.substring(0, 100000) || ''}
  `;

  try {
    const completion = await withRetry(() => groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a legal document analyzer. Output JSON only.' },
        { role: 'user', content: promptInstructions }
      ],
      model: GROQ_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }));

    const responseText = completion.choices[0]?.message?.content || '{}';
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
      confidenceScore: typeof parsedResult.confidenceScore === 'number' ? parsedResult.confidenceScore : 0.5,
      analyzedAt: new Date(),
      modelVersion: 'groq-' + GROQ_MODEL,
    };

    console.log(`[Groq Fallback] Analysis complete. Confidence: ${analysis.confidenceScore}`);
    return analysis;
  } catch (error: any) {
    console.error('[Groq Fallback] Analysis error:', error);
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: `Analysis failed: ${error.message}`,
    };
  }
};

/**
 * Main document analysis function
 * Uses Gemini Vision as primary, Groq as fallback
 */
const analyzeLegalDocument = async (
  fileText: string, 
  buffer?: Buffer, 
  mimeType?: string
): Promise<TAiAnalysis> => {
  console.log(`[AI Service] analyzeLegalDocument called. Buffer: ${buffer?.length || 0}, MIME: ${mimeType}`);

  // Strategy 1: Use Gemini Vision if available and we have the file buffer
  if (isGeminiAvailable() && buffer && mimeType) {
    try {
      console.log('[AI Service] Using Gemini Vision (primary)');
      return await analyzeWithGeminiVision(buffer, mimeType);
    } catch (error) {
      console.warn('[AI Service] Gemini failed, falling back to Groq:', error);
    }
  }

  // Strategy 2: Fallback to Groq with text
  console.log('[AI Service] Using Groq fallback');
  return await analyzeWithGroqFallback(fileText);
};

/**
 * Chat with AI about a document (Uses Groq - text-based chat)
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

/**
 * Extract text from document (kept for Groq fallback)
 * Only used when Gemini is unavailable
 */
const extractTextFromDocument = async (
  buffer: Buffer,
  mimeType: string,
): Promise<string> => {
  try {
    // 1. Text Files
    if (mimeType.includes('text') || mimeType.includes('plain')) {
      return buffer.toString('utf-8');
    }

    // 2. PDF Files
    if (mimeType.includes('pdf') || mimeType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        return pdfData.text || '';
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        return '';
      }
    }

    // 3. Word Documents (DOCX)
    if (
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('docx') ||
      mimeType.includes('msword')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (docError) {
        console.error('DOCX extraction error:', docError);
        return '';
      }
    }

    // 4. Images - Gemini handles this natively, no need for OCR
    if (mimeType.startsWith('image/')) {
      console.log('[Text Extract] Image detected - use Gemini Vision instead');
      return 'IMAGE_FILE_USE_VISION';
    }
    
    return '';
  } catch (error) {
    console.error('Text extraction failed:', error);
    return '';
  }
};

export const AIService = {
  analyzeLegalDocument,
  analyzeWithGeminiVision,
  extractTextFromDocument,
  chatWithAI,
  isGeminiAvailable,
};
