import { NextFunction, Request, Response } from 'express';
import { customerPaymentService } from '../services/customerPayment.service';
import { CreateCustomerPaymentRequestSchema } from '../schema/customerPayment/customerPayment.request.schema';
import {
  CustomerPaymentListResponseSchema,
  CustomerPaymentResponseSchema,
} from '../schema/customerPayment/customerPayment.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { objectIdSchema } from '../utils/objectId.schema';
import { toPlain } from '../utils/toPlain';
import { assertSiteAccess } from '../utils/siteAccess';
import { HttpError } from '../utils/httpError';

export async function createCustomerPayment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const siteId = validateRequest(objectIdSchema, req.params.siteId);
    await assertSiteAccess(req.user, siteId);
    const input = validateRequest(CreateCustomerPaymentRequestSchema, req.body);
    const payment = await customerPaymentService.create(siteId, input, req.user.id);
    const output = validateResponse(CustomerPaymentResponseSchema, toPlain(payment));
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function listCustomerPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = validateRequest(objectIdSchema, req.params.siteId);
    await assertSiteAccess(req.user, siteId);
    const payments = await customerPaymentService.list(siteId);
    const output = validateResponse(CustomerPaymentListResponseSchema, payments.map(toPlain));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomerPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = validateRequest(objectIdSchema, req.params.siteId);
    await assertSiteAccess(req.user, siteId);
    const id = validateRequest(objectIdSchema, req.params.id);
    await customerPaymentService.delete(siteId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
