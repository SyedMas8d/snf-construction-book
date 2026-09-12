import { enterpriseSettingsRepo } from '../repositories/enterpriseSettings.repo';
import { UpdateEnterpriseSettingsInput } from '../schema/enterpriseSettings/enterpriseSettings.request.schema';

const DEFAULT_SETTINGS = {
  name: 'MYVIVA HOUSING PRIVATE LIMITED',
  address: 'No.2, Tannery Street, Somasundram Nagar, Pallavaram, Chennai - 600 043.',
};

export const enterpriseSettingsService = {
  async get(owner: string) {
    const settings = await enterpriseSettingsRepo.get(owner);
    return settings ? { name: settings.name, address: settings.address } : DEFAULT_SETTINGS;
  },

  async update(owner: string, input: UpdateEnterpriseSettingsInput) {
    const settings = await enterpriseSettingsRepo.upsert(owner, input);
    return { name: settings.name, address: settings.address };
  },
};
