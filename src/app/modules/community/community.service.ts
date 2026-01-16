import { Thread, Reply } from './community.model';
import { TThread, TReply } from './community.interface';
import QueryBuilder from '../../builder/queryBuilder';
import { User } from '../user/user.model';

// Helper to get MongoDB ObjectId from custom user id
const getUserObjectId = async (customUserId: string) => {
  const user = await User.findOne({ id: customUserId });
  if (!user) throw new Error('User not found');
  return user._id;
};

const createThread = async (payload: TThread & { author: string }) => {
  // Convert custom user id to MongoDB ObjectId
  const authorObjectId = await getUserObjectId(payload.author as any);
  const result = await Thread.create({ ...payload, author: authorObjectId });
  return result;
};

const getAllThreads = async (query: Record<string, unknown>) => {
  // Build aggregation pipeline for dynamic counts
  const pipeline: any[] = [];

  // Add computed fields for sorting
  pipeline.push({
    $addFields: {
      upvotesCount: { $size: { $ifNull: ['$upvotes', []] } },
      downvotesCount: { $size: { $ifNull: ['$downvotes', []] } },
    }
  });

  // Search filter
  if (query.searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query.searchTerm, $options: 'i' } },
          { content: { $regex: query.searchTerm, $options: 'i' } },
          { tags: { $regex: query.searchTerm, $options: 'i' } }
        ]
      }
    });
  }

  // Category filter
  if (query.category) {
    pipeline.push({ $match: { category: query.category } });
  }

  // Unanswered filter (repliesCount = 0)
  if (query.repliesCount !== undefined) {
    // Need to lookup replies count
    pipeline.push({
      $lookup: {
        from: 'replies',
        localField: '_id',
        foreignField: 'threadId',
        as: 'repliesArray'
      }
    });
    pipeline.push({
      $addFields: {
        repliesCount: { $size: '$repliesArray' }
      }
    });
    pipeline.push({
      $match: { repliesCount: Number(query.repliesCount) }
    });
  } else {
    // Always add repliesCount for display
    pipeline.push({
      $lookup: {
        from: 'replies',
        localField: '_id',
        foreignField: 'threadId',
        as: 'repliesArray'
      }
    });
    pipeline.push({
      $addFields: {
        repliesCount: { $size: '$repliesArray' }
      }
    });
  }

  // Remove the temp array
  pipeline.push({
    $project: {
      repliesArray: 0
    }
  });

  // Sort
  const sortField = (query.sort as string) || '-createdAt';
  const sortOrder = sortField.startsWith('-') ? -1 : 1;
  const sortKey = sortField.replace(/^-/, '');
  pipeline.push({ $sort: { [sortKey]: sortOrder } });

  // Pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  // Populate author
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'authorData'
    }
  });
  pipeline.push({
    $addFields: {
      author: { $arrayElemAt: ['$authorData', 0] }
    }
  });
  pipeline.push({
    $project: {
      authorData: 0,
      'author.password': 0,
      'author.__v': 0
    }
  });

  const result = await Thread.aggregate(pipeline);

  // Get total count for pagination
  const countPipeline: any[] = [];
  if (query.searchTerm) {
    countPipeline.push({
      $match: {
        $or: [
          { title: { $regex: query.searchTerm, $options: 'i' } },
          { content: { $regex: query.searchTerm, $options: 'i' } },
          { tags: { $regex: query.searchTerm, $options: 'i' } }
        ]
      }
    });
  }
  if (query.category) {
    countPipeline.push({ $match: { category: query.category } });
  }
  if (query.repliesCount !== undefined) {
    countPipeline.push({
      $lookup: {
        from: 'replies',
        localField: '_id',
        foreignField: 'threadId',
        as: 'repliesArray'
      }
    });
    countPipeline.push({
      $addFields: { repliesCount: { $size: '$repliesArray' } }
    });
    countPipeline.push({
      $match: { repliesCount: Number(query.repliesCount) }
    });
  }
  countPipeline.push({ $count: 'total' });

  const countResult = await Thread.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit)
  };

  return { meta, result };
};

const getThreadById = async (id: string) => {
  const thread = await Thread.findById(id).populate('author', 'fullName role avatarUrl');
  if (!thread) return null;
  // Increment view count
  thread.views = (thread.views || 0) + 1;
  await thread.save();
  const replies = await Reply.find({ threadId: id }).populate('author', 'fullName role avatarUrl').sort({ createdAt: 1 });
  return { thread, replies };
};

const addReply = async (payload: TReply & { author: string }) => {
  // Convert custom user id to MongoDB ObjectId
  const authorObjectId = await getUserObjectId(payload.author as any);
  const result = await Reply.create({ ...payload, author: authorObjectId });

  // Increment replies count on thread
  await Thread.findByIdAndUpdate(payload.threadId, { $inc: { repliesCount: 1 } });

  return result;
};

const voteThread = async (threadId: string, userId: string, direction: 'up' | 'down') => {
  const thread = await Thread.findById(threadId);
  if (!thread) throw new Error('Thread not found');

  // Convert custom user id to MongoDB ObjectId
  const userObjectId = await getUserObjectId(userId);
  const userIdStr = userObjectId.toString();

  // Initialize downvotes if not exists
  if (!thread.downvotes) thread.downvotes = [];

  const isUpvoted = thread.upvotes.map(id => id.toString()).includes(userIdStr);
  const isDownvoted = thread.downvotes.map(id => id.toString()).includes(userIdStr);

  if (direction === 'up') {
    // If already upvoted, do nothing (can't vote same direction twice)
    if (isUpvoted) {
      return thread; // No change
    }
    // Remove from downvotes if switching from downvote to upvote
    if (isDownvoted) {
      thread.downvotes = thread.downvotes.filter(id => id.toString() !== userIdStr);
    }
    // Add upvote
    thread.upvotes.push(userObjectId as any);
  } else {
    // If already downvoted, do nothing (can't vote same direction twice)
    if (isDownvoted) {
      return thread; // No change
    }
    // Remove from upvotes if switching from upvote to downvote
    if (isUpvoted) {
      thread.upvotes = thread.upvotes.filter(id => id.toString() !== userIdStr);
    }
    // Add downvote
    thread.downvotes.push(userObjectId as any);
  }

  // Update upvotesCount
  thread.upvotesCount = thread.upvotes.length;
  await thread.save();
  return thread;
}

const voteReply = async (replyId: string, userId: string, direction: 'up' | 'down') => {
  const reply = await Reply.findById(replyId);
  if (!reply) throw new Error('Reply not found');

  // Convert custom user id to MongoDB ObjectId
  const userObjectId = await getUserObjectId(userId);
  const userIdStr = userObjectId.toString();

  // Initialize downvotes if not exists
  if (!reply.downvotes) reply.downvotes = [];

  const isUpvoted = reply.upvotes.map(id => id.toString()).includes(userIdStr);
  const isDownvoted = reply.downvotes.map(id => id.toString()).includes(userIdStr);

  if (direction === 'up') {
    // If already upvoted, do nothing (can't vote same direction twice)
    if (isUpvoted) {
      return reply; // No change
    }
    // Remove from downvotes if switching from downvote to upvote
    if (isDownvoted) {
      reply.downvotes = reply.downvotes.filter(id => id.toString() !== userIdStr);
    }
    // Add upvote
    reply.upvotes.push(userObjectId as any);
  } else {
    // If already downvoted, do nothing (can't vote same direction twice)
    if (isDownvoted) {
      return reply; // No change
    }
    // Remove from upvotes if switching from upvote to downvote
    if (isUpvoted) {
      reply.upvotes = reply.upvotes.filter(id => id.toString() !== userIdStr);
    }
    // Add downvote
    reply.downvotes.push(userObjectId as any);
  }

  await reply.save();
  return reply;
}

const markAsSolved = async (threadId: string, replyId: string, userId: string) => {
  const thread = await Thread.findById(threadId);
  if (!thread) throw new Error('Thread not found');

  // Convert custom user id to MongoDB ObjectId and check ownership
  const userObjectId = await getUserObjectId(userId);
  if (thread.author.toString() !== userObjectId.toString()) {
    throw new Error('Only the thread author can mark as solved');
  }

  // Unmark previous accepted answers
  await Reply.updateMany({ threadId }, { isAcceptedAnswer: false });

  // Mark the new accepted answer
  const reply = await Reply.findByIdAndUpdate(replyId, { isAcceptedAnswer: true }, { new: true });
  thread.isSolved = true;
  await thread.save();

  return { thread, reply };
}

const getCommunityStats = async () => {
  const totalThreads = await Thread.countDocuments();
  const totalReplies = await Reply.countDocuments();

  // Count active users (logged in within last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeUsers = await User.countDocuments({ lastLoginAt: { $gte: oneDayAgo } });

  // Count threads created today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyQuestions = await Thread.countDocuments({ createdAt: { $gte: today } });

  return {
    totalThreads,
    totalReplies,
    activeUsers,
    dailyQuestions,
  };
}

export const CommunityService = {
  createThread,
  getAllThreads,
  getThreadById,
  addReply,
  voteThread,
  voteReply,
  markAsSolved,
  getCommunityStats,
};
