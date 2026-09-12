import { ContractorModel } from '../models/Contractor';
import { createDoc, deleteDocById, findAllDocs, findDocById, updateDocById } from '../db/dbOpHelpers';
import { CreateContractorInput, UpdateContractorInput } from '../schema/contractor/contractor.request.schema';
import { SiteScope } from '../utils/siteAccess';

export const contractorRepo = {
  create: (data: CreateContractorInput) => createDoc(ContractorModel, data),
  findAll: (filter: { site?: SiteScope } = {}) => findAllDocs(ContractorModel, filter),
  findById: (id: string) => findDocById(ContractorModel, id),
  updateById: (id: string, data: UpdateContractorInput) => updateDocById(ContractorModel, id, data),
  deleteById: (id: string) => deleteDocById(ContractorModel, id),
};
