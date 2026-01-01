import { DocumentModel } from '../document/document.model';

const getRecentInsightsFromDB = async () => {
  const recentDocuments = await DocumentModel.find({
    processingStatus: 'completed',
    'aiAnalysis.summary': { $exists: true, $ne: '' },
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('caseId', 'title caseNumber');

  return recentDocuments.map((doc) => ({
    id: doc._id,
    caseTitle: (doc.caseId as any).title,
    caseNumber: (doc.caseId as any).caseNumber,
    documentName: doc.fileName,
    summary: doc.aiAnalysis?.summary,
    category: doc.aiAnalysis?.documentCategory,
    entities: doc.aiAnalysis?.extractedEntities?.slice(0, 3),
    analyzedAt: doc.aiAnalysis?.analyzedAt,
  }));
};

export const InsightService = {
  getRecentInsightsFromDB,
};
