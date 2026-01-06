/* eslint-disable @typescript-eslint/no-var-requires */
import mammoth from 'mammoth';
import { geminiModel } from '../../config/gemini.config';
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
  modelVersion: 'gemini-1.5-flash',
};

/**
 * Analyze a legal document using Google Gemini AI
 * @param fileText - The extracted text content from the document
 * @returns AI analysis results with summary, entities, category, and confidence
 */
/**
 * Analyze a legal document using Google Gemini AI
 * @param fileText - The extracted text content from the document
 * @returns AI analysis results with summary, entities, category, and confidence
 */
const analyzeLegalDocument = async (fileText: string): Promise<TAiAnalysis> => {
  // Handle empty or very short text
  if (!fileText || fileText.trim().length < 10) {
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: 'Document contains insufficient text for analysis.',
    };
  }

  // Truncate very long documents to avoid token limits (Gemini Pro has 32k context, safe to increase)
  const truncatedText =
    fileText.length > 30000 ? fileText.substring(0, 30000) + '...' : fileText;

  const prompt = `You are an expert legal aide. Analyze this legal document and provide structured insights.
  
  RETURN ONLY JSON. No markdown formatting. No \`\`\`json blocks.
  
  Format:
  {
    "summary": "A refined, professional executive summary (2-3 paragraphs).",
    "rawSummary": "A longer, detailed explanation of the document contents in markdown format.",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "extractedEntities": [
      {
        "name": "Entity Name",
        "type": "person" | "organization" | "date" | "amount" | "location" | "other",
        "count": 1,
        "mentions": ["context sentence 1"]
      }
    ],
    "legalRefs": [
      {
        "citation": "Section/Law Name",
        "description": "Brief explanation",
        "relevance": "high" | "medium" | "low"
      }
    ],
    "documentCategory": "Contract" | "Affidavit" | ... (one of valid categories),
    "confidenceScore": 0.95
  }
  
  Valid Categories: ${VALID_CATEGORIES.join(', ')}
  
  DOCUMENT TEXT:
  ${truncatedText}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    console.log('[Gemini] Raw Response:', responseText.substring(0, 200) + '...');

    // Bulletproof JSON cleaning
    let cleanedResponse = responseText
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .replace(/^\s*json\s*/i, '')
      .trim();

    // Try to extract JSON object if there's extra text around it
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    // Parse the JSON response
    const parsedResult = JSON.parse(cleanedResponse);

    // Validate and sanitize the response
    const analysis: TAiAnalysis = {
      summary: parsedResult.summary || DEFAULT_AI_ANALYSIS.summary,
      rawSummary: parsedResult.rawSummary || '',
      keyPoints: Array.isArray(parsedResult.keyPoints) ? parsedResult.keyPoints : [],
      extractedEntities: Array.isArray(parsedResult.extractedEntities)
        ? parsedResult.extractedEntities.map((e: any) => ({
            name: e.name || 'Unknown',
            type: e.type || 'other',
            count: e.count || 1,
            mentions: Array.isArray(e.mentions) ? e.mentions : [],
          }))
        : [],
      legalRefs: Array.isArray(parsedResult.legalRefs) ? parsedResult.legalRefs : [],
      documentCategory: VALID_CATEGORIES.includes(parsedResult.documentCategory)
        ? parsedResult.documentCategory
        : 'Other',
      confidenceScore:
        typeof parsedResult.confidenceScore === 'number'
          ? parsedResult.confidenceScore
          : 0.5,
      analyzedAt: new Date(),
      modelVersion: 'gemini-1.5-flash', // Updated to likely model
    };

    return analysis;
  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    return {
      ...DEFAULT_AI_ANALYSIS,
      summary: 'AI analysis encountered an error. Please try again.',
    };
  }
};

/**
 * Extract text from various document formats
 * Supports: PDF, DOCX, DOC, and plain text files
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @returns Extracted text content
 */
const extractTextFromDocument = async (
  buffer: Buffer,
  mimeType: string,
): Promise<string> => {
  try {
    // Plain text files
    if (mimeType.includes('text') || mimeType.includes('plain')) {
      return buffer.toString('utf-8');
    }

    // PDF extraction using pdf-parse
    if (mimeType.includes('pdf') || mimeType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(buffer);
        return pdfData.text || '';
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        return '';
      }
    }

    // DOCX extraction using mammoth
    if (
      mimeType.includes('wordprocessingml') ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType.includes('docx')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (docxError) {
        console.error('DOCX extraction error:', docxError);
        return '';
      }
    }

    // Legacy DOC format (mammoth has limited support)
    if (mimeType === 'application/msword' || mimeType.includes('msword')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (docError) {
        console.error('DOC extraction error:', docError);
        return '';
      }
    }

    // RTF files - try mammoth as fallback
    if (mimeType.includes('rtf')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (rtfError) {
        console.error('RTF extraction error:', rtfError);
        return '';
      }
    }

    // Unsupported format - return empty string (don't crash)
    console.warn(`Unsupported document format for text extraction: ${mimeType}`);
    return '';
  } catch (error) {
    // Catch-all error handler - never crash, just log and return empty
    console.error('Text extraction failed:', error);
    return '';
  }
};

export const GeminiService = {
  analyzeLegalDocument,
  extractTextFromDocument,
};
