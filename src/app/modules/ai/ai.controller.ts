import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AIService } from './ai.service';
import { DocumentModel } from '../document/document.model';
import { Case as CaseModel } from '../case/case.model';

const chatWithAI = catchAsync(async (req: Request, res: Response) => {
  const { message, documentId, documentIds, caseId, history } = req.body;

  let context = '';

  // 1. Document Context (Single or Multiple)
  const targetDocIds = [];
  if (Array.isArray(documentIds) && documentIds.length > 0) {
      targetDocIds.push(...documentIds);
  } else if (documentId) {
      targetDocIds.push(documentId);
  }

  if (targetDocIds.length > 0) {
      const documents = await DocumentModel.find({ id: { $in: targetDocIds } });
      
      documents.forEach(document => {
          context += `
          FOCUS DOCUMENT:
          Title: ${document.fileName}
          Type: ${document.fileType}
          Summary: ${document.aiAnalysis?.summary || 'No summary available'}
          Key Points: ${document.aiAnalysis?.keyPoints?.join('\n') || 'None'}
          Category: ${document.aiAnalysis?.documentCategory || 'Unknown'}
          `;
      });
  }

  // 2. Case Context (Mid Level) - appended to document context or stands alone
  if (caseId) {
      const caseData = await CaseModel.findOne({ id: caseId });
      if (caseData) {
          context += `
          CURRENT CASE CONTEXT:
          Case Name: ${caseData.title}
          Case Number: ${caseData.caseNumber}
          Status: ${caseData.status}
          Type: ${caseData.caseType}
          Urgency: ${caseData.urgency}
          `;
      }
  }


  // 3. Global Context (Fallback/Base) - If no specific context, AI acts as general support
  if (!context) {
      context = `
      You are Advyon AI, a helpful legal assistant for the Advyon Legal Platform.
      You are currently in the general dashboard or have no specific case context.
      Help the user with general legal questions, navigating the platform, or creating new cases.
      `;
  }

  const response = await AIService.chatWithAI(message, context, history);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'AI response generated',
    data: { response },
  });
});

export const AIController = {
  chatWithAI,
};
