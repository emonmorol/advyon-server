import httpStatus from 'http-status';
import AppError from '../../errors/appError';
import { DocumentModel } from '../document/document.model';
import { extractTextFromDocument } from '../../utils/document.utils';
import { OpenRouterService } from './openrouter.service';
import { DocumentServices } from '../document/document.service';
import { Buffer } from 'buffer';
import {
  TChatRequest,
  TChatResponse,
  TDocumentAnalysisResponse,
} from './ai.interface';

const processChat = async (payload: TChatRequest): Promise<TChatResponse> => {
  try {
    const { message, history, documentIds } = payload;
    
    let contextPrompt = '';

    // Handle document context if provided
    if (documentIds) {
        const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
        
        if (ids.length > 0) {
            // Fetch documents with extractedText included
            const documents = await DocumentModel.find({ 
                id: { $in: ids } 
            }).select('+extractedText');

            if (documents.length > 0) {
                contextPrompt += '\n\nHere is the content of the referenced documents:\n';
                documents.forEach((doc, index) => {
                    const text = doc.extractedText || '';
                    if (text) {
                        contextPrompt += `\n--- Document ${index + 1}: ${doc.originalName} ---\n${text.substring(0, 25000)}\n`; // Limit per doc to safe size
                    } else {
                        contextPrompt += `\n--- Document ${index + 1}: ${doc.originalName} ---\n[Content available but not extracted. Summary: ${doc.summary || 'N/A'}]\n`;
                    }
                });
                contextPrompt += '\nUse the above document content to answer the user request.\n';
            }
        }
    }

    // Process chat with context
    const responseText = await OpenRouterService.processChat(message, history, contextPrompt);

    return {
      response: responseText,
      suggestedActions: [], 
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
    const text = await extractTextFromDocument(buffer, mimeType);
    
    // Analyze with OpenRouter
    const analysis = await OpenRouterService.analyzeLegalDocument(text);

    // Update document with analysis results
    document.aiAnalysis = analysis;
    document.extractedText = text;
    document.summary = analysis.summary.refined;
    document.processingStatus = 'completed';
    document.analysisStatus = 'analyzed'; // Legacy field support, corrected enum value
    await document.save();

    return {
        summary: analysis.summary, 
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
