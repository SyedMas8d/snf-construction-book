import { NextFunction, Request, Response } from 'express';
import { enterpriseSettingsService } from '../services/enterpriseSettings.service';
import { UpdateEnterpriseSettingsRequestSchema } from '../schema/enterpriseSettings/enterpriseSettings.request.schema';
import { EnterpriseSettingsResponseSchema } from '../schema/enterpriseSettings/enterpriseSettings.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { HttpError } from '../utils/httpError';

export async function getEnterpriseSettings(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const settings = await enterpriseSettingsService.get(req.user.id);
    const output = validateResponse(EnterpriseSettingsResponseSchema, settings);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function updateEnterpriseSettings(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const input = validateRequest(UpdateEnterpriseSettingsRequestSchema, req.body);
    const settings = await enterpriseSettingsService.update(req.user.id, input);
    const output = validateResponse(EnterpriseSettingsResponseSchema, settings);
    res.json(output);
  } catch (err) {
    next(err);
  }
}
