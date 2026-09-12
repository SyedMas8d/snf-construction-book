import { SiteModel } from '../models/Site';
import { createDoc, deleteDocById, findAllDocs, findDocById, updateDocById } from '../db/dbOpHelpers';
import { CreateSiteInput, UpdateSiteInput } from '../schema/site/site.request.schema';

export const siteRepo = {
  create: (data: CreateSiteInput & { createdBy: string }) => createDoc(SiteModel, data),
  findAll: (filter: { createdBy?: string; ids?: string[] } = {}) => {
    const query: Record<string, unknown> = {};
    if (filter.createdBy) query.createdBy = filter.createdBy;
    if (filter.ids) query._id = { $in: filter.ids };
    return findAllDocs(SiteModel, query);
  },
  async findIdsByCreator(createdBy: string): Promise<string[]> {
    const sites = await SiteModel.find({ createdBy }, { _id: 1 });
    return sites.map((s) => s._id.toString());
  },
  findById: (id: string) => findDocById(SiteModel, id),
  updateById: (id: string, data: UpdateSiteInput) => updateDocById(SiteModel, id, data),
  deleteById: (id: string) => deleteDocById(SiteModel, id),
};
