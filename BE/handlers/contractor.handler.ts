import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { contractorService } from '../services/contractor.service';
import {
  CreateContractorRequestSchema,
  UpdateContractorRequestSchema,
} from '../schema/contractor/contractor.request.schema';
import { ContractorListResponseSchema, ContractorResponseSchema } from '../schema/contractor/contractor.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { objectIdSchema } from '../utils/objectId.schema';
import { toPlain } from '../utils/toPlain';
import { assertSiteAccess, resolveSiteFilter } from '../utils/siteAccess';

const ListContractorsQuerySchema = z.object({
  site: objectIdSchema.optional(),
});

export async function createContractor(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateRequest(CreateContractorRequestSchema, req.body);
    await assertSiteAccess(req.user, input.site);
    const contractor = await contractorService.createContractor(input);
    const output = validateResponse(ContractorResponseSchema, toPlain(contractor));
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function listContractors(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(ListContractorsQuerySchema, req.query);
    const site = await resolveSiteFilter(req.user, query.site);
    const contractors = await contractorService.listContractors(site);
    const output = validateResponse(ContractorListResponseSchema, contractors.map(toPlain));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function getContractor(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const contractor = await contractorService.getContractor(id);
    await assertSiteAccess(req.user, contractor.site.toString());
    const output = validateResponse(ContractorResponseSchema, toPlain(contractor));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function updateContractor(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await contractorService.getContractor(id);
    await assertSiteAccess(req.user, existing.site.toString());
    const input = validateRequest(UpdateContractorRequestSchema, req.body);
    const contractor = await contractorService.updateContractor(id, input);
    const output = validateResponse(ContractorResponseSchema, toPlain(contractor));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function deleteContractor(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await contractorService.getContractor(id);
    await assertSiteAccess(req.user, existing.site.toString());
    await contractorService.deleteContractor(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
