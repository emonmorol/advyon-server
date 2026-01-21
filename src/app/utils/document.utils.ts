/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
import { Buffer } from 'buffer';
import mammoth from 'mammoth';

// pdf-parse doesn't have proper ES module exports, use require
const pdfParse = require('pdf-parse');

/**
 * Extract text from various document formats
 * Supports: PDF, DOCX, DOC, and plain text files
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @returns Extracted text content
 */
export const extractTextFromDocument = async (
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
