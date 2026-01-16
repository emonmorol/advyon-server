import { Types } from 'mongoose';

export type TCategory = 'Family Law' | 'Criminal Defense' | 'Civil Litigation' | 'Property Law' | 'Corporate' | 'Intellectual Property' | 'Others';

export interface TReply {
    _id?: Types.ObjectId;
    threadId: Types.ObjectId;
    content: string;
    author: Types.ObjectId;
    upvotes: Types.ObjectId[];
    downvotes: Types.ObjectId[];
    isAcceptedAnswer: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TThread {
    _id?: Types.ObjectId;
    title: string;
    content: string;
    author: Types.ObjectId;
    category: TCategory;
    tags: string[];
    views: number;
    upvotes: Types.ObjectId[];
    downvotes: Types.ObjectId[];
    isSolved: boolean;
    repliesCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
