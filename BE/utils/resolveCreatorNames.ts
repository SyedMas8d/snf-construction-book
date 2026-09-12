import { userRepo } from '../repositories/user.repo';

export async function resolveCreatorNames(ids: (string | undefined | null)[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => !!id)));
  if (uniqueIds.length === 0) {
    return new Map();
  }
  const users = await userRepo.findByIds(uniqueIds);
  return new Map(users.map((u) => [u._id.toString(), u.name]));
}
