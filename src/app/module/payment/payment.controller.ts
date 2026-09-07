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

/**
 * Stripe Webhook
 */
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

/**
 * Create bKash Payment
 */
const createBkashPayment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error('Authentication required');
  }

  const { assessmentId } = req.body;

  const payment = await PaymentService.createBkashPayment({
    recruiterUserId: req.user.userId,
    assessmentId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'bKash payment created successfully',
    data: payment,
  });
});

/**
 * Execute bKash Payment
 */
const executeBkashPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentID } = req.body;

  if (!paymentID) {
    throw new Error('bKash paymentID is required');
  }

  const payment = await PaymentService.executeBkashPayment(paymentID);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'bKash payment executed successfully',
    data: payment,
  });
});

// bKash Callback
const bkashCallback = catchAsync(async (req: Request, res: Response) => {
  const { paymentID, status } = req.query;

  if (!paymentID || typeof paymentID !== 'string') {
    throw new Error('bKash paymentID is required');
  }

  if (!status || typeof status !== 'string') {
    throw new Error('bKash payment status is required');
  }

  const result = await PaymentService.handleBkashCallback(paymentID, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'bKash callback processed successfully',
    data: result,
  });
});

const queryBkashPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentID } = req.params;

  if (!paymentID || Array.isArray(paymentID)) {
    throw new Error('Valid bKash paymentID is required');
  }

  const result = await PaymentService.queryBkashPayment(paymentID);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'bKash payment status retrieved successfully',
    data: result,
  });
});

export const PaymentController = {
  createStripePayment,
  stripeWebhook,
  createBkashPayment,
  executeBkashPayment,
  bkashCallback,
  queryBkashPayment,
};
