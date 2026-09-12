import { FilterQuery } from 'mongoose';
import { UserModel, User } from '../models/User';
import { createDoc, deleteDocById, findDocById, findPaginatedDocs, updateDocById } from '../db/dbOpHelpers';
import { Role } from '../utils/jwt';

function searchFilter(role: Role, extra: FilterQuery<User>, search?: string): FilterQuery<User> {
  if (!search?.trim()) {
    return { role, ...extra };
  }
  const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return { role, ...extra, $or: [{ name: re }, { email: re }, { phone: re }] };
}

export const userRepo = {
  create: (data: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: Role;
    createdBy?: string;
    assignedSites?: string[];
  }) => createDoc(UserModel, data),
  findByEmail: (email: string) => UserModel.findOne({ email }),
  findById: (id: string) => findDocById(UserModel, id),
  findByIds: (ids: string[]) => UserModel.find({ _id: { $in: ids } }),
  findEngineersByCreatorPaginated: (createdBy: string, page: number, limit: number, search?: string) =>
    findPaginatedDocs(UserModel, searchFilter('engineer', { createdBy }, search), page, limit),
  findAdminsPaginated: (page: number, limit: number, search?: string) =>
    findPaginatedDocs(UserModel, searchFilter('admin', {}, search), page, limit),
  updateById: (id: string, data: { assignedSites: string[] }) => updateDocById(UserModel, id, data),
  updatePasswordHash: (id: string, passwordHash: string) => updateDocById(UserModel, id, { passwordHash }),
  deleteById: (id: string) => deleteDocById(UserModel, id),
};
