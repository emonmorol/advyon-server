import { Schema, model } from 'mongoose';
import { TLegal } from './legal.interface';

const legalSchema = new Schema<TLegal>(
    {
        actName: {
            type: String,
            required: true,
        },
        year: {
            type: String,
            required: true,
        },
        number: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        chapter: {
            type: String,
            required: true,
        },
        chapterTitle: {
            type: String,
            required: true,
        },
        previewText: {
            type: String,
            required: true,
        },
        fullText: {
            type: String,
            required: true,
        },
        subsections: {
            type: [String],
            default: [],
        },
        relatedSections: {
            type: [String],
            default: [],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

// Indexes for search
legalSchema.index({ actName: 1, number: 1 }, { unique: true });
legalSchema.index({ title: 'text', actName: 'text', fullText: 'text' });

// Query middleware
legalSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

legalSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

export const Legal = model<TLegal>('Legal', legalSchema);
