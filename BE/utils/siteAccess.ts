import { HttpError } from './httpError';
import { Role } from './jwt';
import { siteRepo } from '../repositories/site.repo';

type ReqUser = { id: string; role: Role; assignedSites: string[] };

export type SiteScope = string | { $in: string[] };

export async function assertSiteAccess(user: ReqUser | undefined, siteId: string): Promise<void> {
  if (!user) {
    throw new HttpError(403, 'Not assigned to this site');
  }
  if (user.role === 'admin') {
    const site = await siteRepo.findById(siteId);
    if (!site || site.createdBy.toString() !== user.id) {
      throw new HttpError(403, 'Not assigned to this site');
    }
    return;
  }
  if (user.role === 'engineer' && user.assignedSites.includes(siteId)) {
    return;
  }
  throw new HttpError(403, 'Not assigned to this site');
}

// For list endpoints: if a specific site was requested, verify + return it; otherwise
// scope engineers down to their assigned sites and admins down to the sites they own
// (super_admin never touches sites — no filter it could legitimately see anything under).
export async function resolveSiteFilter(user: ReqUser | undefined, requestedSite?: string): Promise<SiteScope | undefined> {
  if (requestedSite) {
    await assertSiteAccess(user, requestedSite);
    return requestedSite;
  }
  if (user?.role === 'engineer') {
    return { $in: user.assignedSites };
  }
  if (user?.role === 'admin') {
    return { $in: await siteRepo.findIdsByCreator(user.id) };
  }
  return { $in: [] };
}
