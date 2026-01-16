import { Thread, Reply } from './community.model';
import { TThread, TReply } from './community.interface';
import QueryBuilder from '../../builder/queryBuilder';

const createThread = async (payload: TThread) => {
  const result = await Thread.create(payload);
  return result;
};

const getAllThreads = async (query: Record<string, unknown>) => {
  const threadQuery = new QueryBuilder(Thread.find().populate('author', 'fullName role avatar'), query)
    .search(['title', 'content', 'tags'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await threadQuery.modelQuery;
  const meta = await threadQuery.countTotal();

  // For each thread, get reply count
  const threadsWithCounts = await Promise.all(result.map(async (thread: any) => {
    const repliesCount = await Reply.countDocuments({ threadId: thread._id });
    return { ...thread.toObject(), repliesCount };
  }));

  return { meta, result: threadsWithCounts };
};

const getThreadById = async (id: string) => {
  const thread = await Thread.findById(id).populate('author', 'fullName role avatar');
  if (!thread) return null;
  const replies = await Reply.find({ threadId: id }).populate('author', 'fullName role avatar').sort({ createdAt: 1 });
  return { thread, replies };
};

const addReply = async (payload: TReply) => {
  const result = await Reply.create(payload);
  return result;
};

const voteThread = async (threadId: string, userId: string) => {
  const thread = await Thread.findById(threadId);
  if (!thread) throw new Error('Thread not found');

  const isUpvoted = thread.upvotes.map(id => id.toString()).includes(userId);

  if (isUpvoted) {
    thread.upvotes = thread.upvotes.filter(id => id.toString() !== userId);
  } else {
    thread.upvotes.push(userId as any);
  }
  await thread.save();
  return thread;
}

export const CommunityService = {
  createThread,
  getAllThreads,
  getThreadById,
  addReply,
  voteThread
};
