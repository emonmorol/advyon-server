import { Schema, model } from 'mongoose';
import { TReply, TThread } from './community.interface';

const replySchema = new Schema<TReply>({
    threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isAcceptedAnswer: { type: Boolean, default: false },
}, { timestamps: true });

const threadSchema = new Schema<TThread>({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
        type: String,
        enum: ['Family Law', 'Criminal Defense', 'Civil Litigation', 'Property Law', 'Corporate', 'Intellectual Property', 'Others'],
        required: true
    },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isSolved: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export const Reply = model<TReply>('Reply', replySchema);
export const Thread = model<TThread>('Thread', threadSchema);
