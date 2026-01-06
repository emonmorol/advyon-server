/* eslint-disable @typescript-eslint/no-var-requires */
import mammoth from 'mammoth';
import { groqClient, AI_MODEL } from '../../config/groq.config';
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
  documentCategory: 'Other',
  confidenceScore: 0,
  analyzedAt: new Date(),
  modelVersion: AI_MODEL,
};

/**
 * Analyze a legal document using Groq (Llama 3)
 */
const analyzeLegalDocument = async (fileText: string): Promise<TAiAnalysis> => {
  // Handle empty or very short text
  if (!fileText || fileText.trim().length < 10) {
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: 'Document contains insufficient text for analysis.',
    };
  }

  // Truncate very long documents
  const truncatedText =
    fileText.length > 25000 ? fileText.substring(0, 25000) + '...' : fileText;

  const systemPrompt = `You are an expert legal aide. Analyze the provided legal document text and output structured JSON.
  
  RETURN ONLY JSON. No markdown formatting. No \`\`\`json blocks.
  
  Output Schema:
  {
    "summary": "Professional executive summary (2-3 paragraphs)",
    "rawSummary": "Detailed markdown explanation of contents",
    "keyPoints": ["point 1", "point 2", ...],
    "extractedEntities": [{ "name": "Entity Name", "type": "person/organization/date/etc", "count": 1, "mentions": [] }],
    "legalRefs": [{ "citation": "Law Name", "description": "desc", "relevance": "high/medium/low" }],
    "documentCategory": "One of: ${VALID_CATEGORIES.join(', ')}",
    "confidenceScore": 0.95
  }`;

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `DOCUMENT TEXT:\n${truncatedText}` },
      ],
      model: AI_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    console.log('[Groq] Raw Response:', responseText.substring(0, 200) + '...');

    const parsedResult = JSON.parse(responseText);

    // Validate and sanitize
    const analysis: TAiAnalysis = {
      summary: parsedResult.summary || DEFAULT_AI_ANALYSIS.summary,
      rawSummary: parsedResult.rawSummary || '',
      keyPoints: Array.isArray(parsedResult.keyPoints) ? parsedResult.keyPoints : [],
      extractedEntities: Array.isArray(parsedResult.extractedEntities)
        ? parsedResult.extractedEntities
        : [],
      legalRefs: Array.isArray(parsedResult.legalRefs) ? parsedResult.legalRefs : [],
      documentCategory: VALID_CATEGORIES.includes(parsedResult.documentCategory)
        ? parsedResult.documentCategory
        : 'Other',
      confidenceScore: parsedResult.confidenceScore || 0.5,
      analyzedAt: new Date(),
      modelVersion: AI_MODEL,
    };

    return analysis;
  } catch (error) {
    console.error('Groq AI analysis error:', error);
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: 'AI analysis encountered an error. Please try again.',
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
        ...history.map((msg: any) => ({ 
            role: msg.role === 'user' ? 'user' : 'assistant', 
            content: msg.content 
        })),
        { role: 'user', content: message }
    ];

    const completion = await groqClient.chat.completions.create({
      messages: messages as any,
      model: AI_MODEL,
    });

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
    if (mimeType.includes('text') || mimeType.includes('plain')) {
      return buffer.toString('utf-8');
    }
    if (mimeType.includes('pdf') || mimeType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(buffer);
        return pdfData.text || '';
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        return '';
      }
    }
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
    return '';
  } catch (error) {
    console.error('Text extraction failed:', error);
    return '';
  }
};

export const GeminiService = {
  analyzeLegalDocument,
  extractTextFromDocument,
  chatWithAI,
};
