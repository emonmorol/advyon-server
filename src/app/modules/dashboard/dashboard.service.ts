const getDashboardStats = async () => {
    // Mock data as per requirements. In real app, aggregate from Case, Hearing models.
  return {
    activeCasesCount: 12,
    upcomingHearingsCount: 3,
    pendingReviewCount: 5,
    clientMessagesCount: 8,
  };
};

export const DashboardServices = {
  getDashboardStats,
};
