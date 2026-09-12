import { siteRepo } from '../repositories/site.repo';
import { CreateSiteInput, UpdateSiteInput } from '../schema/site/site.request.schema';
import { HttpError } from '../utils/httpError';

export const siteService = {
  createSite: (input: CreateSiteInput, createdBy: string) => siteRepo.create({ ...input, createdBy }),

  listSites: (filter: { createdBy?: string; ids?: string[] } = {}) => siteRepo.findAll(filter),

  async getSite(id: string) {
    const site = await siteRepo.findById(id);
    if (!site) {
      throw new HttpError(404, 'Site not found');
    }
    return site;
  },

  async updateSite(id: string, input: UpdateSiteInput) {
    const site = await siteRepo.updateById(id, input);
    if (!site) {
      throw new HttpError(404, 'Site not found');
    }
    return site;
  },

  async deleteSite(id: string) {
    const site = await siteRepo.deleteById(id);
    if (!site) {
      throw new HttpError(404, 'Site not found');
    }
    return site;
  },
};
