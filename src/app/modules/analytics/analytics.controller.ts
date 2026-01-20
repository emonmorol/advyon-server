import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { Case } from '../case/case.model';
import { User } from '../user/user.model';
import { DocumentModel } from '../document/document.model';

const getAnalyticsOverview = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  
  // Get active cases count
  const activeCasesCount = await Case.countDocuments({ 
    $or: [{ createdBy: userId }, { assignedTo: userId }],
    status: { $in: ['active', 'open', 'Active', 'Open'] }
  });

  // Get total clients
  // Assuming strict relationship or just counting clients in system for now (Lawyer view)
  const totalClientsCount = await User.countDocuments({ role: 'client' });

  // Get filings due (documents pending review or cases with deadlines next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const filingsDueCount = await Case.countDocuments({
    $or: [{ createdBy: userId }, { assignedTo: userId }],
    nextDeadline: { $gte: new Date(), $lte: nextWeek }
  });

  // Calculate Case Distribution by Type
  const caseDistribution = await Case.aggregate([
    { $match: { $or: [{ createdBy: userId }, { assignedTo: userId }] } },
    { $group: { _id: '$caseType', count: { $sum: 1 } } }
  ]);
  
  const totalCases = caseDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const formattedDistribution = caseDistribution.map(item => ({
    area: item._id || 'Uncategorized',
    percentage: Math.round((item.count / totalCases) * 100)
  }));

  // Get Upcoming Deadlines
  const upcomingDeadlines = await Case.find({
    $or: [{ createdBy: userId }, { assignedTo: userId }],
    nextDeadline: { $gte: new Date() }
  })
  .sort({ nextDeadline: 1 })
  .limit(5)
  .select('title nextDeadline status caseType');

  const result = {
    stats: {
        activeCases: activeCasesCount,
        totalClients: totalClientsCount,
        filingsDue: filingsDueCount,
        billableHours: 0 // Stub
    },
    caseDistribution: formattedDistribution,
    upcomingDeadlines: upcomingDeadlines.map(c => ({
        case: c.title,
        task: 'Deadline', // Generic task name
        date: c.nextDeadline,
        color: 'red' // could be dynamic based on urgency
    }))
  };

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Analytics retrieved successfully',
    data: result,
  });
});

export const AnalyticsController = {
  getAnalyticsOverview
};
