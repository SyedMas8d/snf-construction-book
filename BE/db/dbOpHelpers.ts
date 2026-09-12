import { FilterQuery, HydratedDocument, Model } from 'mongoose';

export function createDoc<T>(model: Model<T>, data: Record<string, unknown>) {
  return model.create(data);
}

export function findAllDocs<T>(model: Model<T>, filter: FilterQuery<T> = {}) {
  return model.find(filter).sort({ createdAt: -1 });
}

export type PaginatedResult<T> = { items: HydratedDocument<T>[]; total: number; page: number; limit: number };

export async function findPaginatedDocs<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  page: number,
  limit: number
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    model.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export function findDocById<T>(model: Model<T>, id: string) {
  return model.findById(id);
}

export function updateDocById<T>(model: Model<T>, id: string, data: Record<string, unknown>) {
  return model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

export function deleteDocById<T>(model: Model<T>, id: string) {
  return model.findByIdAndDelete(id);
}
