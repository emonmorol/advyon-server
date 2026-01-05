/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
import { Buffer } from 'buffer';
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
  summary: {
    refined: 'Unable to analyze document content.',
    raw: 'Unable to analyze document content.',
  },
  extractedEntities: [],
  documentCategory: 'Other',
  confidenceScore: 0,
  analyzedAt: new Date(),
  modelVersion: 'gemini-3-flash-preview',
};

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
      summary: {
        refined: 'Document contains insufficient text for analysis.',
        raw: 'Document contains insufficient text for analysis.',
      },
    };
  }

  // Truncate very long documents to avoid token limits
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
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

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
        raw: summaryText, // Use same text for raw unless we want to distinguish later
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
      modelVersion: 'gemini-3-flash-preview',
    };

    return analysis;
  } catch (error) {
    // Log the error for debugging
    console.error('Gemini AI analysis error:', error);

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
