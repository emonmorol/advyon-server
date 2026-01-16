import { Legal } from './legal.model';
import { TLegalQuery } from './legal.interface';

export const getAllLegalsFromDB = async (query: TLegalQuery) => {
    const { search, actName, year, number, page = 1, limit = 10 } = query;

    const queryObject: any = {};

    if (search) {
        queryObject.$or = [
            { title: { $regex: search, $options: 'i' } },
            { actName: { $regex: search, $options: 'i' } },
            { fullText: { $regex: search, $options: 'i' } },
            { number: { $regex: search, $options: 'i' } },
        ];
    }

    if (actName && actName !== 'all') {
        queryObject.actName = actName;
    }

    if (year && year !== 'all') {
        queryObject.year = year;
    }

    if (number) {
        queryObject.number = number;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const result = await Legal.find(queryObject)
        .skip(skip)
        .limit(Number(limit))
        .sort({ actName: 1, number: 1 });

    const total = await Legal.countDocuments(queryObject);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        result,
    };
};

export const getSingleLegalFromDB = async (id: string) => {
    const result = await Legal.findById(id);
    return result;
};


