import {
  TChatRequest,
  TChatResponse,
  TDocumentAnalysisResponse,
} from './ai.interface';

const processChat = async (payload: TChatRequest): Promise<TChatResponse> => {
  // Mock response for now as per requirements to setup the structure
  // In a real implementation, this would call the GeminiService or similar
  return {
    response: `# Analysis for Case ${payload.caseId || 'Unknown'}\n\nBased on the context provided, here is a summary of the situation... \n\n**Key Observations:**\n\n1. Point one\n2. Point two`,
    suggestedActions: [
      {
        label: 'View Related Document',
        action: 'navigate',
        payload: { id: 'doc_123' },
      },
      {
        label: 'Schedule Hearing',
        action: 'open_modal',
        payload: { id: 'schedule_hearing' },
      },
    ],
  };
};

const analyzeDocument = async (): Promise<TDocumentAnalysisResponse> => {
  // Mock response for now
  return {
    summary: {
            refined: 'This document outlines the partnership agreement between Party A and Party B. Key terms include profit sharing, dispute resolution, and termination clauses.',
            raw: 'Agreement made on... between... whereas... now therefore...',
    },
    entities: [
      { type: 'person', name: 'John Doe', count: 3 },
      { type: 'organization', name: 'Acme Corp', count: 5 },
      { type: 'date', name: '2023-01-01', count: 1 },
      { type: 'amount', name: '$50,000', count: 2 },
    ],
    keyPoints: [
      { id: 1, text: 'Profit sharing is 50/50', importance: 'high' },
      { id: 2, text: 'Termination requires 30 days notice', importance: 'medium' },
      { id: 3, text: 'Jurisdiction in NY', importance: 'low' },
    ],
    legalRefs: [
      {
        citation: 'Section 404',
        description: 'Standard liability clause',
        relevance: 'high',
      },
    ],
  };
};

export const AIServices = {
  processChat,
  analyzeDocument,
};
