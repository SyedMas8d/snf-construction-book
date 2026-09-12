import { NextFunction, Request, Response } from 'express';
import { siteService } from '../services/site.service';
import { CreateSiteRequestSchema, UpdateSiteRequestSchema } from '../schema/site/site.request.schema';
import { SiteListResponseSchema, SiteResponseSchema } from '../schema/site/site.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { objectIdSchema } from '../utils/objectId.schema';
import { toPlain } from '../utils/toPlain';
import { assertSiteAccess } from '../utils/siteAccess';
import { HttpError } from '../utils/httpError';

export async function createSite(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const input = validateRequest(CreateSiteRequestSchema, req.body);
    const site = await siteService.createSite(input, req.user.id);
    const output = validateResponse(SiteResponseSchema, toPlain(site));
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function listSites(req: Request, res: Response, next: NextFunction) {
  try {
    const sites =
      req.user?.role === 'engineer'
        ? await siteService.listSites({ ids: req.user.assignedSites })
        : req.user?.role === 'admin'
        ? await siteService.listSites({ createdBy: req.user.id })
        : [];
    const output = validateResponse(SiteListResponseSchema, sites.map(toPlain));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function getSite(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    await assertSiteAccess(req.user, id);
    const site = await siteService.getSite(id);
    const output = validateResponse(SiteResponseSchema, toPlain(site));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function updateSite(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    await assertSiteAccess(req.user, id);
    const input = validateRequest(UpdateSiteRequestSchema, req.body);
    const site = await siteService.updateSite(id, input);
    const output = validateResponse(SiteResponseSchema, toPlain(site));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function deleteSite(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    await assertSiteAccess(req.user, id);
    await siteService.deleteSite(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
