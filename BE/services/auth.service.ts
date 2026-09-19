import bcrypt from 'bcryptjs';
import { userRepo } from '../repositories/user.repo';
import { siteRepo } from '../repositories/site.repo';
import { enterpriseSettingsService } from './enterpriseSettings.service';
import {
  SignupInput,
  LoginInput,
  CreateEngineerInput,
  CreateAdminInput,
  UpdateEngineerSitesInput,
  ChangePasswordInput,
} from '../schema/auth/auth.request.schema';
import { signToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';
import { toPlain } from '../utils/toPlain';

const SALT_ROUNDS = 10;

// Excludes visually ambiguous characters (0/O, 1/l/I) since this gets read off a phone
// screen and typed in by hand on first login.
const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function generateTemporaryPassword(length = 10): string {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return password;
}

async function assertOwnsSites(adminId: string, siteIds: string[]): Promise<void> {
  if (siteIds.length === 0) return;
  const ownedIds = new Set(await siteRepo.findIdsByCreator(adminId));
  if (siteIds.some((id) => !ownedIds.has(id))) {
    throw new HttpError(422, 'One or more sites do not belong to your enterprise');
  }
}

export const authService = {
  async signup(input: SignupInput) {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) {
      throw new HttpError(409, 'An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepo.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: 'super_admin',
    });
    return { token: signToken({ id: user._id.toString(), role: 'super_admin' }), user };
  },

  async login(input: LoginInput) {
    const user = await userRepo.findByEmail(input.email);
    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }
    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) {
      throw new HttpError(401, 'Invalid email or password');
    }
    return { token: signToken({ id: user._id.toString(), role: user.role }), user };
  },

  async createAdmin(input: CreateAdminInput) {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) {
      throw new HttpError(409, 'An account with this email already exists');
    }
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    const user = await userRepo.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: 'admin',
    });
    const enterprise = await enterpriseSettingsService.update(user._id.toString(), {
      name: input.enterpriseName,
      address: input.enterpriseAddress,
    });
    return { user, enterprise, temporaryPassword };
  },

  async listAdmins(page: number, limit: number, search?: string) {
    const { items, total } = await userRepo.findAdminsPaginated(page, limit, search);
    const withEnterprise = await Promise.all(
      items.map(async (user) => ({
        ...(toPlain(user) as Record<string, unknown>),
        enterprise: await enterpriseSettingsService.get(user._id.toString()),
      }))
    );
    return { items: withEnterprise, total, page, limit };
  },

  async createEngineer(input: CreateEngineerInput, adminId: string) {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) {
      throw new HttpError(409, 'An account with this email already exists');
    }
    await assertOwnsSites(adminId, input.assignedSites);
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    const user = await userRepo.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: 'engineer',
      createdBy: adminId,
      assignedSites: input.assignedSites,
    });
    return { user, temporaryPassword };
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new HttpError(401, 'User no longer exists');
    }
    const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new HttpError(401, 'Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await userRepo.updatePasswordHash(userId, passwordHash);
  },

  async getById(id: string) {
    const user = await userRepo.findById(id);
    if (!user) {
      throw new HttpError(401, 'User no longer exists');
    }
    return user;
  },

  listEngineers: (adminId: string, page: number, limit: number, search?: string) =>
    userRepo.findEngineersByCreatorPaginated(adminId, page, limit, search),

  async deleteEngineer(id: string, adminId: string) {
    const user = await userRepo.findById(id);
    if (!user || user.role !== 'engineer' || user.createdBy?.toString() !== adminId) {
      throw new HttpError(404, 'Engineer not found');
    }
    await userRepo.deleteById(id);
  },

  async updateEngineerSites(id: string, adminId: string, input: UpdateEngineerSitesInput) {
    const user = await userRepo.findById(id);
    if (!user || user.role !== 'engineer' || user.createdBy?.toString() !== adminId) {
      throw new HttpError(404, 'Engineer not found');
    }
    await assertOwnsSites(adminId, input.assignedSites);
    const updated = await userRepo.updateById(id, { assignedSites: input.assignedSites });
    if (!updated) {
      throw new HttpError(404, 'Engineer not found');
    }
    return updated;
  },

  async resetEngineerPassword(id: string, adminId: string) {
    const user = await userRepo.findById(id);
    if (!user || user.role !== 'engineer' || user.createdBy?.toString() !== adminId) {
      throw new HttpError(404, 'Engineer not found');
    }
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    await userRepo.updatePasswordHash(id, passwordHash);
    return { user, temporaryPassword };
  },

  async resetAdminPassword(id: string) {
    const user = await userRepo.findById(id);
    if (!user || user.role !== 'admin') {
      throw new HttpError(404, 'Admin not found');
    }
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    await userRepo.updatePasswordHash(id, passwordHash);
    const enterprise = await enterpriseSettingsService.get(id);
    return { user, enterprise, temporaryPassword };
  },
};
