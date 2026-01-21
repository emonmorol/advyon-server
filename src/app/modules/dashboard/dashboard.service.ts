import { User } from '../user/user.model';
import { Case } from '../case/case.model';
import { Message } from '../message/message.model';
import { ActivityModel } from '../activity/activity.model';
import { DocumentModel } from '../document/document.model';
import httpStatus from 'http-status';
import AppError from '../../errors/appError';

// Phase 1.5: Unified Dashboard Stats (legacy endpoint)
const getDashboardStats = async () => {
  // Mock data for backwards compatibility
  return {
    activeCasesCount: 12,
    upcomingHearingsCount: 3,
    pendingReviewCount: 5,
    clientMessagesCount: 8,
  };
};

// Phase 1.5: Comprehensive Unified Dashboard Endpoint
const getUnifiedDashboard = async (userId: string) => {
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
    isDeleted: { $ne: true },
  });

  const caseIds = userCases.map(c => c._id);

  // Calculate stats
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const activeCasesCount = userCases.filter(c => c.status === 'active').length;
  const upcomingHearingsCount = userCases.filter(c => {
    if (!c.nextDeadline) return false;
    const deadline = new Date(c.nextDeadline);
    return deadline >= now && deadline <= sevenDaysFromNow;
  }).length;
  const pendingReviewCount = userCases.filter(c => 
    ['review', 'pending'].includes(c.status?.toLowerCase() || '')
  ).length;

  // Get pending messages count
  const pendingMessagesCount = await Message.countDocuments({
    receiverId: user._id,
    status: 'unread',
  });

  // Get recent messages
  const recentMessages = await Message.find({
    receiverId: user._id,
    status: { $in: ['unread', 'read'] },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('senderId', 'fullName displayName email avatarUrl')
    .populate('caseId', 'title caseNumber')
    .lean();

  // Get recent activities
  const recentActivities = await ActivityModel.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('caseId', 'title caseNumber')
    .lean();

  // Get recent cases (for "Recent Matters")
  const recentCases = userCases
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map(c => ({
      _id: c._id,
      id: c._id,
      title: c.title,
      caseNumber: c.caseNumber,
      status: c.status,
      caseType: c.caseType,
      urgency: c.urgency,
      nextDeadline: c.nextDeadline,
      updatedAt: c.updatedAt,
    }));

  // Get AI insights summary
  const [totalDocuments, analyzedDocuments] = await Promise.all([
    DocumentModel.countDocuments({ caseId: { $in: caseIds } }),
    DocumentModel.countDocuments({
      caseId: { $in: caseIds },
      processingStatus: 'completed',
      'aiAnalysis.summary': { $exists: true, $ne: '' },
    }),
  ]);

  // Get upcoming deadlines for "Today's Schedule"
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaySchedule = userCases
    .filter(c => {
      if (!c.nextDeadline) return false;
      const deadline = new Date(c.nextDeadline);
      return deadline >= todayStart && deadline <= todayEnd;
    })
    .map(c => ({
      id: c._id,
      title: c.title,
      time: c.nextDeadline,
      type: 'Deadline',
      caseNumber: c.caseNumber,
    }));

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    stats: {
      activeCasesCount,
      upcomingHearingsCount,
      pendingReviewCount,
      clientMessagesCount: pendingMessagesCount,
      totalDocuments,
      analyzedDocuments,
    },
    recentCases,
    recentMessages,
    recentActivities,
    todaySchedule,
    urgentTasks: userCases
      .filter(c => c.urgency === 'high' && c.status === 'active')
      .length,
  };
};

export const DashboardServices = {
  getDashboardStats,
  getUnifiedDashboard,
};
