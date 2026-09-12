import { EnterpriseSettingsModel } from '../models/EnterpriseSettings';

export const enterpriseSettingsRepo = {
  get: (owner: string) => EnterpriseSettingsModel.findOne({ owner }),
  upsert: (owner: string, data: { name: string; address: string }) =>
    EnterpriseSettingsModel.findOneAndUpdate({ owner }, { owner, ...data }, { upsert: true, new: true, setDefaultsOnInsert: true }),
};
