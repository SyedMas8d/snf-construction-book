import { SignupKeyModel } from '../models/SignupKey';

export const signupKeyRepo = {
  get: () => SignupKeyModel.findOne({}),
};
