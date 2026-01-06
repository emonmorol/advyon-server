import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { GeminiService } from '../gemini/gemini.service';
import { DocumentModel } from '../document/document.model';

const chatWithAI = catchAsync(async (req: Request, res: Response) => {
  const { message, documentId, history } = req.body;

  let context = '';
  if (documentId) {
    const document = await DocumentModel.findOne({ id: documentId });
    if (document && document.aiAnalysis) {
      context = `
      CONTEXT DOCUMENT:
      Title: ${document.fileName}
      Summary: ${document.aiAnalysis.summary}
      Category: ${document.aiAnalysis.documentCategory}
      Key Points: ${document.aiAnalysis.keyPoints?.join('\n')}
      `;
    }
  }

  const response = await GeminiService.chatWithAI(message, context, history);

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
