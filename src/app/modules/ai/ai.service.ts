import httpStatus from 'http-status';
import AppError from '../../errors/appError';
import { DocumentModel } from '../document/document.model';
import { GeminiService } from '../gemini/gemini.service';
import { DocumentServices } from '../document/document.service';
import { Buffer } from 'buffer';
import {
  TChatRequest,
  TChatResponse,
  TDocumentAnalysisResponse,
} from './ai.interface';
import { geminiModel } from '../../config/gemini.config';

const processChat = async (payload: TChatRequest): Promise<TChatResponse> => {
  try {
    const { message, history } = payload;
    
    // Construct chat history for Gemini
    // Note: Gemini API expects history in a specific format if using startChat
    // For simplicity with generateContent, we'll append history to prompt or use startChat if applicable
    
    const chat = geminiModel.startChat({
        history: history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    return {
      response: text,
      suggestedActions: [], // Gemini doesn't inherently suggest actions without specific prompting instructions
    };
  } catch (error) {
    console.error('Chat processing error:', error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process chat message');
  }
};

const analyzeDocument = async (documentId: string): Promise<TDocumentAnalysisResponse> => {
  const document = await DocumentModel.findOne({ id: documentId });
  if (!document) {
    throw new AppError(httpStatus.NOT_FOUND, 'Document not found');
  }

  if (!document.storagePath) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Document has no file URL');
  }

  try {
    // Update status to processing
    await DocumentServices.updateProcessingStatus(documentId, 'processing');

    // Fetch file content
    const fileResponse = await fetch(document.storagePath);
    if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = document.mimeType || 'text/plain'; // Use stored mimeType or fallback

    // Extract text
    const text = await GeminiService.extractTextFromDocument(buffer, mimeType);
    
    // Analyze with Gemini
    const analysis = await GeminiService.analyzeLegalDocument(text);

    // Update document with analysis results
    document.aiAnalysis = analysis;
    document.processingStatus = 'completed';
    document.analysisStatus = 'analyzed'; // Legacy field support, corrected enum value
    await document.save();

    return {
        summary: analysis.summary, // Now passing the full object directly
        entities: analysis.extractedEntities.map(entity => ({
            type: 'organization', // Default mapping
            name: entity,
            count: 1
        })),
        keyPoints: [],
        legalRefs: [],
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Document analysis failed for ${documentId}:`, error);
    await DocumentServices.updateProcessingStatus(documentId, 'failed', errorMessage);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Analysis failed: ${errorMessage}`);
  }
};

export const AIServices = {
  processChat,
  analyzeDocument,
};
