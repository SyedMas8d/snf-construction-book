import { contractorRepo } from '../repositories/contractor.repo';
import { CreateContractorInput, UpdateContractorInput } from '../schema/contractor/contractor.request.schema';
import { HttpError } from '../utils/httpError';
import { SiteScope } from '../utils/siteAccess';

export const contractorService = {
  createContractor: (input: CreateContractorInput) => contractorRepo.create(input),

  listContractors: (site?: SiteScope) => contractorRepo.findAll(site ? { site } : {}),

  async getContractor(id: string) {
    const contractor = await contractorRepo.findById(id);
    if (!contractor) {
      throw new HttpError(404, 'Contractor not found');
    }
    return contractor;
  },

  async updateContractor(id: string, input: UpdateContractorInput) {
    const contractor = await contractorRepo.updateById(id, input);
    if (!contractor) {
      throw new HttpError(404, 'Contractor not found');
    }
    return contractor;
  },

  async deleteContractor(id: string) {
    const contractor = await contractorRepo.deleteById(id);
    if (!contractor) {
      throw new HttpError(404, 'Contractor not found');
    }
    return contractor;
  },
};
