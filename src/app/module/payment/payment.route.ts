import express from 'express';

import { PaymentController } from './payment.controller';
import { PaymentValidation } from './payment.validation';

import { auth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';

import { Role } from '../../../generated/prisma/enums';

const router = express.Router();

router.post(
  '/stripe/create-checkout-session',
  auth(Role.RECRUITER),
  validateRequest(PaymentValidation.createStripePaymentSchema),
  PaymentController.createStripePayment
);

router.post(
  '/bkash/create',
  auth(Role.RECRUITER),
  validateRequest(PaymentValidation.createStripePaymentSchema),
  PaymentController.createBkashPayment
);

router.post(
  '/bkash/execute',
  auth(Role.RECRUITER),
  PaymentController.executeBkashPayment
);

router.get('/bkash/callback', PaymentController.bkashCallback);

router.get(
  '/bkash/query/:paymentID',
  auth(Role.RECRUITER),
  PaymentController.queryBkashPayment
);

router.post('/stripe/webhook', PaymentController.stripeWebhook);

export const PaymentRoutes = router;
