/**
 * @fileoverview Payment routes.
 */
import express from 'express';
import { PaymentController } from './payment.controller';
import { handleStripeWebhook } from './webhook.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { getPaymentsQuerySchema } from './payment.validation';

const router = express.Router();

/**
 * POST /payments/webhook — Stripe webhook endpoint.
 * IMPORTANT: Uses express.raw() for Stripe signature verification.
 * This must NOT use JSON body parsing.
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
);

/** GET /payments/me — Current user's payment history */
router.get(
  '/me',
  auth(),
  validateRequest(getPaymentsQuerySchema),
  PaymentController.getUserPayments,
);

/** GET /payments/all — All payments (admin only) */
router.get(
  '/all',
  auth('admin', 'superAdmin'),
  validateRequest(getPaymentsQuerySchema),
  PaymentController.getAllPayments,
);

export const PaymentRoutes = router;
