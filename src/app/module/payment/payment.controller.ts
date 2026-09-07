import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { PaymentService } from './payment.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const createStripePayment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const { assessmentId } = req.body;

  const payment = await PaymentService.createStripePayment({
    recruiterUserId: req.user.userId,
    assessmentId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Stripe checkout session created successfully',
    data: payment,
  });
});

// Stripe Webhook

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Missing Stripe signature',
    });
    return;
  }

  const result = await PaymentService.handleStripeWebhook(req.body, signature);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stripe webhook processed successfully',
    data: result,
  });
});

export const PaymentController = {
  createStripePayment,
  stripeWebhook,
};
