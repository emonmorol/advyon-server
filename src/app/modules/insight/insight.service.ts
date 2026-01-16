import { DocumentModel } from '../document/document.model';
import { User } from '../user/user.model';
import { Case } from '../case/case.model';
import { TCase } from '../case/case.interface';
import httpStatus from 'http-status';
import AppError from '../../errors/appError';

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
    caseTitle: (doc.caseId as any)?.title || 'Unknown Case',
    caseNumber: (doc.caseId as any)?.caseNumber || 'N/A',
    documentName: doc.fileName,
    summary: doc.aiAnalysis?.summary,
    category: doc.aiAnalysis?.documentCategory,
    entities: doc.aiAnalysis?.extractedEntities?.slice(0, 3),
    analyzedAt: doc.aiAnalysis?.analyzedAt,
  }));
};

// Phase 1.4: Get insights for a specific user's cases
const getMyInsights = async (userId: string, limit: number = 5) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Get user's cases
  const userCases = await Case.find({ 
    $or: [
      { createdBy: user._id },
      { assignedTo: user._id },
    ]
  }).select('_id');
  
  const caseIds = userCases.map((c: TCase) => c._id);

  const recentDocuments = await DocumentModel.find({
    caseId: { $in: caseIds },
    processingStatus: 'completed',
    'aiAnalysis.summary': { $exists: true, $ne: '' },
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('caseId', 'title caseNumber');

  return recentDocuments.map((doc) => ({
    id: doc._id,
    caseTitle: (doc.caseId as any)?.title || 'Unknown Case',
    caseNumber: (doc.caseId as any)?.caseNumber || 'N/A',
    documentName: doc.fileName,
    summary: doc.aiAnalysis?.summary,
    category: doc.aiAnalysis?.documentCategory,
    entities: doc.aiAnalysis?.extractedEntities?.slice(0, 3),
    analyzedAt: doc.aiAnalysis?.analyzedAt,
  }));
};

// Phase 1.4: Get dashboard AI summary
const getDashboardSummary = async (userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Get user's cases
  const userCases = await Case.find({ 
    $or: [
      { createdBy: user._id },
      { assignedTo: user._id },
    ],
    status: 'active'
  });
  
  const caseIds = userCases.map((c: TCase) => c._id);

  // Get document stats with AI analysis
  const [totalDocuments, analyzedDocuments, pendingAnalysis] = await Promise.all([
    DocumentModel.countDocuments({ caseId: { $in: caseIds } }),
    DocumentModel.countDocuments({ 
      caseId: { $in: caseIds },
      processingStatus: 'completed',
      'aiAnalysis.summary': { $exists: true, $ne: '' },
    }),
    DocumentModel.countDocuments({ 
      caseId: { $in: caseIds },
      processingStatus: { $in: ['pending', 'processing'] }
    }),
  ]);

  // Get latest AI insights for tips
  const latestInsights = await DocumentModel.find({
    caseId: { $in: caseIds },
    processingStatus: 'completed',
    'aiAnalysis.summary': { $exists: true, $ne: '' },
  })
    .sort({ updatedAt: -1 })
    .limit(3)
    .select('aiAnalysis.documentCategory aiAnalysis.summary');

  // Generate AI tips based on recent analysis
  const aiTips = [];
  
  if (pendingAnalysis > 0) {
    aiTips.push({
      type: 'info',
      message: `${pendingAnalysis} document(s) are pending AI analysis`,
    });
  }

  if (latestInsights.length > 0) {
    const categories = [...new Set(latestInsights.map(d => d.aiAnalysis?.documentCategory).filter(Boolean))];
    if (categories.length > 0) {
      aiTips.push({
        type: 'insight',
        message: `Recent documents classified as: ${categories.join(', ')}`,
      });
    }
  }

  // Deadline reminders from cases
  const upcomingDeadlines = userCases
    .filter((c: TCase) => c.nextDeadline && new Date(c.nextDeadline) > new Date())
    .sort((a: TCase, b: TCase) => new Date(a.nextDeadline!).getTime() - new Date(b.nextDeadline!).getTime())
    .slice(0, 3);

  if (upcomingDeadlines.length > 0) {
    aiTips.push({
      type: 'warning',
      message: `${upcomingDeadlines.length} upcoming deadline(s) in the next 7 days`,
    });
  }

  return {
    stats: {
      totalDocuments,
      analyzedDocuments,
      pendingAnalysis,
      activeCases: userCases.length,
    },
    tips: aiTips,
    recentCategories: [...new Set(latestInsights.map(d => d.aiAnalysis?.documentCategory).filter(Boolean))],
  };
};

export const InsightService = {
  getRecentInsightsFromDB,
  getMyInsights,
  getDashboardSummary,
};
