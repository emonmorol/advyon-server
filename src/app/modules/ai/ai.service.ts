/* eslint-disable @typescript-eslint/no-var-requires */
import mammoth from 'mammoth';
import { groqClient, AI_MODEL as GROQ_MODEL } from '../../config/groq.config'; // Renamed import
import { geminiModel } from '../../config/gemini.config'; // New import
import { TAiAnalysis, TDocumentCategory } from '../document/document.interface';

// pdf-parse doesn't have proper ES module exports, use require
const pdfParse = require('pdf-parse');

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
  modelVersion: 'gemini-1.5-flash',
};


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
 * Analyze a legal document using Groq (Llama 3)
 */
/**
 * Analyze a legal document using Google Gemini (1.5 Flash)
 */
const analyzeLegalDocument = async (fileText: string): Promise<TAiAnalysis> => {
  // Handle scanned PDF detection
  if (fileText === 'SCANNED_PDF_DETECTED') {
      return {
          ...DEFAULT_AI_ANALYSIS,
          summary: 'This document appears to be a scanned PDF (images only). The current AI model requires text. Please upload an OCR-processed PDF, a Word document, or convert the pages to images.',
          suggestions: ['Use an OCR tool to convert this PDF to text', 'Upload images of the pages instead', 'Ensure the PDF has selectable text'],
          documentCategory: 'Other',
      };
  }

  // Handle empty or very short text
  if (!fileText || fileText.trim().length < 10) {
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: 'Document contains insufficient text for analysis.',
    };
  }

  // Use JSON Schema for structured output
  // Gemini supports JSON mode natively, but requires specific prompting or configuration.
  // 1.5 Flash is good at following constraints.
  const prompt = `You are an expert legal aide. Analyze the provided legal document text and output structured JSON.
  
  You must strictly follow this JSON schema:
  {
    "summary": "Professional executive summary (2-3 paragraphs)",
    "rawSummary": "Detailed markdown explanation of contents",
    "keyPoints": ["point 1", "point 2", ...],
    "extractedEntities": [{ "name": "Entity Name", "type": "person/organization/date/location/amount", "count": 1, "mentions": ["context sentence"] }],
    "legalRefs": [{ "citation": "Law Name", "description": "desc", "relevance": "high/medium/low" }],
    "suggestions": ["Suggestion 1 specifically for this case", "Suggestion 2..."],
    "documentCategory": "One of: ${VALID_CATEGORIES.join(', ')}",
    "confidenceScore": 0.95 (number between 0 and 1)
  }

  If the document is too short or unclear, give a low confidence score but still try to categorize it.
  
  DOCUMENT TEXT:
  ${fileText.substring(0, 900000)} 
  // Gemini Flash has 1M context, so we can send a lot more text than Grok. 
  // Safety cap at 900k chars to be safe.
  `;

  try {
    const result = await withRetry(() => geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json", // Force JSON output
            temperature: 0.1,
        }
    }));

    const responseText = result.response.text();
    console.log('[Gemini] Raw Response:', responseText.substring(0, 200) + '...');

    let parsedResult;
    try {
        parsedResult = JSON.parse(responseText);
    } catch (e) {
        console.error('Failed to parse Gemini JSON:', e);
        // Fallback: try to clean markdown code blocks if present (though responseMimeType should prevent this)
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '');
        try {
            parsedResult = JSON.parse(cleanText);
        } catch (e2) {
             return {
                ...DEFAULT_AI_ANALYSIS,
                summary: 'AI returned invalid content structure. Please try again.',
            };
        }
    }

    // Validate and sanitize
    const analysis: TAiAnalysis = {
      summary: parsedResult.summary || DEFAULT_AI_ANALYSIS.summary,
      rawSummary: parsedResult.rawSummary || '',
      keyPoints: Array.isArray(parsedResult.keyPoints) ? parsedResult.keyPoints : [],
      extractedEntities: Array.isArray(parsedResult.extractedEntities)
        ? parsedResult.extractedEntities
        : [],
      legalRefs: Array.isArray(parsedResult.legalRefs) ? parsedResult.legalRefs : [],
      suggestions: Array.isArray(parsedResult.suggestions) ? parsedResult.suggestions : [],
      documentCategory: VALID_CATEGORIES.includes(parsedResult.documentCategory)
        ? parsedResult.documentCategory
        : 'Other',
      confidenceScore: typeof parsedResult.confidenceScore === 'number' ? parsedResult.confidenceScore : 0.5,
      analyzedAt: new Date(),
      modelVersion: 'gemini-1.5-flash',
    };

    return analysis;
  } catch (error: any) {
    console.error('Gemini AI analysis error:', error);
    
    // Improve error feedback
    let errorMessage = 'AI analysis encountered an error.';
    if (error.message?.includes('429')) errorMessage = 'Analysis failed due to high traffic (Rate Limit). Please try again in a minute.';
    if (error.message?.includes('SAFETY')) errorMessage = 'Analysis blocked due to safety filters.';

    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: `${errorMessage} (Details: ${error.message})`,
    };
  }
};

/**
 * Chat with AI about a document
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
 * Extract text from various document formats
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
        let pdfParseLib = pdfParse;
        if (typeof pdfParseLib !== 'function' && pdfParseLib.default) {
            pdfParseLib = pdfParseLib.default;
        }

        const pdfData = await pdfParseLib(buffer);
        let text = pdfData.text || '';
        
        // Simple heuristic: if text length is very small relative to number of pages, it might be scanned
        // But pdf-parse often returns enough whitespace/newline that length check can be tricky.
        // Better check: is there any alphanumeric content?
        const alphaNumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
        
        if (alphaNumericCount < 50 && buffer.length > 5000) {
            return 'SCANNED_PDF_DETECTED'; 
        }

        return text;
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

    // 4. Images (OCR)
    if (mimeType.startsWith('image/')) {
       console.log('Attempting OCR for image...');
       try {
         // Dynamically import tesseract (ESM)
         const { createWorker } = await import('tesseract.js');
         
         const worker = await createWorker('eng');
         console.log('Tesseract worker created');
         
         const ret = await worker.recognize(buffer);
         console.log('OCR Complete. Text length:', ret.data.text?.length);
         
         const text = ret.data.text;
         await worker.terminate();

         return text || '';
       } catch (ocrError) {
         console.error('OCR extraction error:', ocrError);
         return '';
       }
    }
    
    return '';
  } catch (error) {
    console.error('Text extraction failed:', error);
    return '';
  }
};

export const AIService = {
  analyzeLegalDocument,
  extractTextFromDocument,
  chatWithAI,
};
