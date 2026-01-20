/* eslint-disable @typescript-eslint/no-var-requires */
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import os from 'os';
// @ts-ignore
import pdfParse from 'pdf-parse'; // Use ES import with interop
import { groqClient, AI_MODEL as GROQ_MODEL } from '../../config/groq.config';
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
  modelVersion: 'llama-3-8b-8192',
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
 * IMPL STRATEGY: Text-Only Analysis (Free/Fast)
 */
const analyzeLegalDocument = async (fileText: string, buffer?: Buffer, mimeType?: string): Promise<TAiAnalysis> => {
  console.log(`[AI Service] Starting Legal Document Analysis. Input text length: ${fileText?.length || 0}`);
  
  // JSON Schema validation instructions
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

  if (!fileText || fileText.length < 50) {
       console.log('[AI Service] Error: No content available for analysis.');
       return {
           ...DEFAULT_AI_ANALYSIS,
           summary: 'Document content is empty or unreadable. Please upload a clear text PDF or Image.',
           confidenceScore: 0
       };
  }

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
    console.log('[AI Service] Groq Raw Response:', responseText.substring(0, 200) + '...');

    let parsedResult;
    try {
        parsedResult = JSON.parse(responseText);
    } catch (e) {
        console.error('Failed to parse Groq JSON:', e);
        return {
           ...DEFAULT_AI_ANALYSIS,
           summary: 'AI returned invalid content structure.',
        };
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
      modelVersion: GROQ_MODEL,
    };

    return analysis;
  } catch (error: any) {
    console.error('Groq AI analysis error:', error);
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: `Analysis failed: ${error.message}`,
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
        // pdf-parse is imported with @ts-ignore, cast to any to invoke
        const pdfData = await (pdfParse as any)(buffer);
        let text = pdfData.text || '';
        
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
