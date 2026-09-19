import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import {
  ChangePasswordRequestSchema,
  CreateAdminRequestSchema,
  CreateEngineerRequestSchema,
  LoginRequestSchema,
  PaginatedListQuerySchema,
  SignupRequestSchema,
  UpdateEngineerSitesRequestSchema,
} from '../schema/auth/auth.request.schema';
import {
  AuthResponseSchema,
  CreateAdminResponseSchema,
  CreateEngineerResponseSchema,
  PaginatedAdminListResponseSchema,
  PaginatedUserListResponseSchema,
  UserResponseSchema,
} from '../schema/auth/auth.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { objectIdSchema } from '../utils/objectId.schema';
import { toPlain } from '../utils/toPlain';
import { HttpError } from '../utils/httpError';

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateRequest(SignupRequestSchema, req.body);
    const { token, user } = await authService.signup(input);
    const output = validateResponse(AuthResponseSchema, { token, user: toPlain(user) });
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateRequest(LoginRequestSchema, req.body);
    const { token, user } = await authService.login(input);
    const output = validateResponse(AuthResponseSchema, { token, user: toPlain(user) });
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const user = await authService.getById(req.user.id);
    const output = validateResponse(UserResponseSchema, toPlain(user));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const input = validateRequest(ChangePasswordRequestSchema, req.body);
    await authService.changePassword(req.user.id, input);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function createAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateRequest(CreateAdminRequestSchema, req.body);
    const { user, enterprise, temporaryPassword } = await authService.createAdmin(input);
    const output = validateResponse(CreateAdminResponseSchema, {
      ...(toPlain(user) as Record<string, unknown>),
      enterprise,
      temporaryPassword,
    });
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function listAdmins(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(PaginatedListQuerySchema, req.query);
    const result = await authService.listAdmins(query.page, query.limit, query.search);
    const output = validateResponse(PaginatedAdminListResponseSchema, result);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function createEngineer(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const input = validateRequest(CreateEngineerRequestSchema, req.body);
    const { user, temporaryPassword } = await authService.createEngineer(input, req.user.id);
    const output = validateResponse(CreateEngineerResponseSchema, {
      ...(toPlain(user) as Record<string, unknown>),
      temporaryPassword,
    });
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function listEngineers(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const query = validateRequest(PaginatedListQuerySchema, req.query);
    const result = await authService.listEngineers(req.user.id, query.page, query.limit, query.search);
    const output = validateResponse(PaginatedUserListResponseSchema, {
      items: result.items.map(toPlain),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function deleteEngineer(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const id = validateRequest(objectIdSchema, req.params.id);
    await authService.deleteEngineer(id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function updateEngineerSites(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const id = validateRequest(objectIdSchema, req.params.id);
    const input = validateRequest(UpdateEngineerSitesRequestSchema, req.body);
    const user = await authService.updateEngineerSites(id, req.user.id, input);
    const output = validateResponse(UserResponseSchema, toPlain(user));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function resetEngineerPassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const id = validateRequest(objectIdSchema, req.params.id);
    const { user, temporaryPassword } = await authService.resetEngineerPassword(id, req.user.id);
    const output = validateResponse(CreateEngineerResponseSchema, {
      ...(toPlain(user) as Record<string, unknown>),
      temporaryPassword,
    });
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function resetAdminPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const { user, enterprise, temporaryPassword } = await authService.resetAdminPassword(id);
    const output = validateResponse(CreateAdminResponseSchema, {
      ...(toPlain(user) as Record<string, unknown>),
      enterprise,
      temporaryPassword,
    });
    res.json(output);
  } catch (err) {
    next(err);
  }
}
