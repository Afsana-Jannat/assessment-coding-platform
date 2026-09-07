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

router.post('/stripe/webhook', PaymentController.stripeWebhook);

export const PaymentRoutes = router;
