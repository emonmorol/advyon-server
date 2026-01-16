import { Document } from 'mongoose';

export interface TLegal extends Document {
    actName: string;
    year: string;
    number: string;
    title: string;
    chapter: string;
    chapterTitle: string;
    previewText: string;
    fullText: string;
    subsections: string[];
    relatedSections: string[];
    id?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TLegalQuery {
    search?: string;
    actName?: string;
    year?: string;
    page?: number;
    limit?: number;
}
