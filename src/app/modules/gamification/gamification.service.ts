import { User } from '../user/user.model';

// Point values for different actions
export const POINT_VALUES = {
    CREATE_THREAD: 5,
    ADD_REPLY: 3,
    UPVOTE_RECEIVED: 2,
    DOWNVOTE_RECEIVED: -1,
    ACCEPTED_ANSWER: 10,
    FIRST_REPLY_BONUS: 2,
};

/**
 * Award points to a user (silent fail - logs error but doesn't throw)
 * Uses atomic $inc to prevent race conditions
 */
export const awardPoints = async (
    userId: string,
    action: keyof typeof POINT_VALUES,
    relatedId?: string
): Promise<void> => {
    try {
        const points = POINT_VALUES[action];
        if (!points || points <= 0) return;

        await User.findOneAndUpdate(
            { id: userId },
            {
                $inc: {
                    points: points,
                    weeklyPoints: points
                }
            }
        );

        console.log(`[Gamification] Awarded ${points} points to user ${userId} for ${action}`);
    } catch (error) {
        // Silent fail - log but don't throw
        console.error(`[Gamification] Failed to award points:`, error);
    }
};

/**
 * Deduct points from a user (floor at 0)
 * Uses aggregation to ensure points don't go negative
 */
export const deductPoints = async (
    userId: string,
    action: keyof typeof POINT_VALUES,
    relatedId?: string
): Promise<void> => {
    try {
        const pointsToDeduct = Math.abs(POINT_VALUES[action]);
        if (!pointsToDeduct) return;

        // Get current points first to floor at 0
        const user = await User.findOne({ id: userId });
        if (!user) return;

        const newPoints = Math.max(0, (user.points || 0) - pointsToDeduct);
        const newWeeklyPoints = Math.max(0, (user.weeklyPoints || 0) - pointsToDeduct);

        await User.findOneAndUpdate(
            { id: userId },
            {
                points: newPoints,
                weeklyPoints: newWeeklyPoints
            }
        );

        console.log(`[Gamification] Deducted ${pointsToDeduct} points from user ${userId} for ${action}`);
    } catch (error) {
        // Silent fail - log but don't throw
        console.error(`[Gamification] Failed to deduct points:`, error);
    }
};

/**
 * Get top contributors sorted by points
 */
export const getTopContributors = async (limit: number = 10) => {
    try {
        const contributors = await User.find({ isDeleted: false })
            .sort({ points: -1 })
            .limit(limit)
            .select('id fullName avatarUrl role points weeklyPoints');

        return contributors;
    } catch (error) {
        console.error(`[Gamification] Failed to get top contributors:`, error);
        return [];
    }
};

/**
 * Reset weekly points for all users (to be run weekly via cron)
 */
export const resetWeeklyPoints = async (): Promise<void> => {
    try {
        await User.updateMany(
            {},
            {
                weeklyPoints: 0,
                lastWeekReset: new Date()
            }
        );
        console.log(`[Gamification] Weekly points reset completed`);
    } catch (error) {
        console.error(`[Gamification] Failed to reset weekly points:`, error);
    }
};

export const GamificationService = {
    awardPoints,
    deductPoints,
    getTopContributors,
    resetWeeklyPoints,
    POINT_VALUES,
};
