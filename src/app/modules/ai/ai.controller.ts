import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AIContextManagerService } from './ai-context-manager.service';
import { AIService } from './ai.service';
import { AIToolService } from './ai.tool.service';

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

const runTool = catchAsync(async (req: Request, res: Response) => {
  const result = await AIToolService.runTool({
    userId: req.user.userId,
    toolKey: req.params.toolKey,
    input: req.body.input,
    caseId: req.body.caseId,
    documentId: req.body.documentId,
    documentIds: req.body.documentIds,
    history: req.body.history,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.blocked
      ? 'AI tool request blocked by policy guardrails'
      : 'AI tool executed successfully',
    data: result,
  });
});

const getToolHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await AIToolService.getHistory({
    userId: req.user.userId,
    toolKey: req.query.toolKey as string | undefined,
    status: req.query.status as string | undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'AI tool history retrieved',
    meta: result.meta,
    data: result.result,
  });
});

const exportToolHistory = catchAsync(async (req: Request, res: Response) => {
  const exportData = await AIToolService.exportHistory({
    userId: req.user.userId,
    toolKey: req.query.toolKey as string | undefined,
    format: req.query.format as string | undefined,
  });

  res.setHeader('Content-Type', exportData.contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${exportData.fileName}"`,
  );
  return res.status(200).send(exportData.body);
});

export const AIController = {
  chatWithAI,
  runTool,
  getToolHistory,
  exportToolHistory,
};
