import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AIContextManagerService } from './ai-context-manager.service';
import { AIService } from './ai.service';

const chatWithAI = catchAsync(async (req: Request, res: Response) => {
  const { message, documentId, documentIds, caseId, history } = req.body;

  const preparedContext = await AIContextManagerService.prepareContext({
    userId: req.user.userId,
    message,
    documentId,
    documentIds,
    caseId,
    history,
  });

  if (!preparedContext.allowed) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'AI request rejected by policy guardrails',
      data: {
        response:
          preparedContext.rejectionMessage ||
          'I can only assist with legal and platform-related questions.',
        policySignals: preparedContext.policySignals,
      },
    });
  }

  const response = await AIService.chatWithAI(
    preparedContext.sanitizedMessage,
    preparedContext.contextPrompt,
    preparedContext.history,
  );

  AIContextManagerService.appendAssistantMessage(
    preparedContext.memoryKey,
    response,
  );

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

