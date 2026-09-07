import axios from 'axios';
import Stripe from 'stripe';

import config from '../../config';
import { prisma } from '../../lib/prisma';

import {
  IBkashCreatePaymentResponse,
  IBkashExecutePaymentResponse,
  IBkashQueryPaymentResponse,
  ICreateBkashPayment,
  ICreateStripePayment,
} from './payment.interface';

const stripe = new Stripe(config.stripe_secret_key);

// Get bKash Grant Token
const getBkashToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        app_key: config.bkash_app_key,
        app_secret: config.bkash_app_secret,
      },
      {
        headers: {
          username: config.bkash_username,
          password: config.bkash_password,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    if (!response.data?.id_token) {
      throw new Error(
        `bKash token generation failed: ${
          response.data?.statusMessage || 'Unknown error'
        }`
      );
    }

    return response.data.id_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `bKash token generation failed: ${
          error.response?.data?.statusMessage || error.message
        }`
      );
    }

    throw error;
  }
};

// Create Stripe Checkout Session

const createStripePayment = async ({
  recruiterUserId,
  assessmentId,
}: ICreateStripePayment) => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
  });

  if (!recruiter || recruiter.isDeleted) {
    throw new Error('Recruiter not found');
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: recruiter.id,
      isDeleted: false,
    },
  });

  if (!assessment) {
    throw new Error('Assessment not found or unauthorized');
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      recruiterId: recruiter.id,
      assessmentId: assessment.id,
      status: 'PAID',
    },
  });

  if (existingPayment) {
    throw new Error('This assessment has already been paid for');
  }

  const payment = await prisma.payment.create({
    data: {
      amount: 100,
      currency: 'BDT',
      status: 'PENDING',
      paymentMethod: 'STRIPE',
      recruiterId: recruiter.id,
      assessmentId: assessment.id,
    },
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',

      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency: 'bdt',
            product_data: {
              name: assessment.title,
              description:
                'Payment for Developer Assessment Platform assessment',
            },
            unit_amount: 10000,
          },
          quantity: 1,
        },
      ],

      metadata: {
        paymentId: payment.id,
        assessmentId: assessment.id,
        recruiterId: recruiter.id,
      },

      // success_url: `${config.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      // cancel_url: `${config.frontend_url}/payment/cancel`,

      success_url: `${config.backend_url}/api/v1/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.backend_url}/api/v1/payments/stripe/cancel`,

      customer_email: recruiter.email,
    });

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        transactionId: session.id,
      },
    });

    return {
      paymentId: payment.id,
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'FAILED',
      },
    });

    throw error;
  }
};

// Stripe Webhook
const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string | string[]
) => {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripe_webhook_secret
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const paymentId = session.metadata?.paymentId;

    if (!paymentId) {
      throw new Error('Payment ID missing from Stripe metadata');
    }

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status === 'PAID') {
      return {
        paymentId: payment.id,
        status: payment.status,
        message: 'Payment already processed',
      };
    }

    const expectedAmount = Math.round(payment.amount * 100);

    if (session.amount_total !== expectedAmount) {
      throw new Error('Payment amount mismatch');
    }

    if (session.currency?.toUpperCase() !== payment.currency.toUpperCase()) {
      throw new Error('Payment currency mismatch');
    }

    if (session.payment_status !== 'paid') {
      return {
        paymentId: payment.id,
        status: payment.status,
        message: 'Payment is not completed yet',
      };
    }

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        transactionId: session.id,
      },
    });

    return {
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      transactionId: updatedPayment.transactionId,
      paidAt: updatedPayment.paidAt,
    };
  }

  return {
    received: true,
    eventType: event.type,
  };
};

// Create bKash Payment
const createBkashPayment = async ({
  recruiterUserId,
  assessmentId,
}: ICreateBkashPayment): Promise<IBkashCreatePaymentResponse> => {
  const recruiter = await prisma.recruiter.findUnique({
    where: {
      userId: recruiterUserId,
    },
  });

  if (!recruiter || recruiter.isDeleted) {
    throw new Error('Recruiter not found');
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: recruiter.id,
      isDeleted: false,
    },
  });

  if (!assessment) {
    throw new Error('Assessment not found or unauthorized');
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      recruiterId: recruiter.id,
      assessmentId: assessment.id,
      status: 'PAID',
    },
  });

  if (existingPayment) {
    throw new Error('This assessment has already been paid for');
  }

  const payment = await prisma.payment.create({
    data: {
      amount: 100,
      currency: 'BDT',
      status: 'PENDING',
      paymentMethod: 'BKASH',
      recruiterId: recruiter.id,
      assessmentId: assessment.id,
    },
  });

  try {
    const token = await getBkashToken();

    const merchantInvoiceNumber = `ASSESS-${payment.id}`;

    //  bKash payment
    const response = await axios.post<IBkashCreatePaymentResponse>(
      `${config.bkash_base_url}/tokenized/checkout/create`,
      {
        mode: '0011',
        payerReference: recruiter.id,
        callbackURL: `${config.backend_url}/api/v1/payments/bkash/callback`,
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
        intent: 'sale',
        merchantInvoiceNumber,
      },
      {
        headers: {
          Authorization: token,
          'X-APP-Key': config.bkash_app_key,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const bkashData = response.data;

    if (bkashData.statusCode && bkashData.statusCode !== '0000') {
      throw new Error(
        `bKash payment creation failed: ${
          bkashData.statusMessage || 'Unknown error'
        }`
      );
    }

    if (!bkashData.paymentID || !bkashData.bkashURL) {
      throw new Error('Invalid response received from bKash');
    }
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        transactionId: bkashData.paymentID,
      },
    });

    return {
      paymentID: bkashData.paymentID,
      bkashURL: bkashData.bkashURL,
      transactionStatus: bkashData.transactionStatus,
      amount: bkashData.amount,
      currency: bkashData.currency,
      merchantInvoiceNumber: bkashData.merchantInvoiceNumber,
      statusCode: bkashData.statusCode,
      statusMessage: bkashData.statusMessage,
    };
  } catch (error) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'FAILED',
      },
    });

    if (axios.isAxiosError(error)) {
      throw new Error(
        `bKash payment creation failed: ${
          error.response?.data?.statusMessage || error.message
        }`
      );
    }

    throw error;
  }
};

const handleBkashCallback = async (paymentID: string, status: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      transactionId: paymentID,
      paymentMethod: 'BKASH',
    },
  });

  if (!payment) {
    throw new Error('bKash payment not found');
  }

  if (payment.status === 'PAID') {
    return {
      paymentID,
      status: 'PAID',
      message: 'Payment already completed',
    };
  }

  if (status.toLowerCase() === 'failure') {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'FAILED',
      },
    });

    return {
      paymentID,
      status: 'FAILED',
      message: 'bKash payment failed',
    };
  }

  if (status.toLowerCase() !== 'success') {
    throw new Error(`Unknown bKash callback status: ${status}`);
  }

  return executeBkashPayment(paymentID);
};

const queryBkashPayment = async (
  paymentID: string
): Promise<IBkashQueryPaymentResponse> => {
  try {
    const token = await getBkashToken();

    const response = await axios.post<IBkashQueryPaymentResponse>(
      `${config.bkash_base_url}/tokenized/checkout/payment/status`,
      {
        paymentID,
      },
      {
        headers: {
          Authorization: token,
          'X-APP-Key': config.bkash_app_key,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `bKash payment query failed: ${
          error.response?.data?.statusMessage || error.message
        }`
      );
    }

    throw error;
  }
};

const executeBkashPayment = async (
  paymentID: string
): Promise<IBkashExecutePaymentResponse> => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: paymentID,
        paymentMethod: 'BKASH',
      },
    });

    if (!payment) {
      throw new Error('bKash payment not found');
    }

    if (payment.status === 'PAID') {
      return {
        paymentID,
        transactionStatus: 'Completed',
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
      };
    }

    const token = await getBkashToken();

    const response = await axios.post<IBkashExecutePaymentResponse>(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        paymentID,
      },
      {
        headers: {
          Authorization: token,
          'X-APP-Key': config.bkash_app_key,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const bkashData = response.data;

    if (bkashData.statusCode && bkashData.statusCode !== '0000') {
      throw new Error(
        `bKash payment execution failed: ${
          bkashData.statusMessage || 'Unknown error'
        }`
      );
    }

    if (
      bkashData.amount &&
      Number(bkashData.amount) !== Number(payment.amount)
    ) {
      throw new Error('bKash payment amount mismatch');
    }

    if (bkashData.currency && bkashData.currency !== payment.currency) {
      throw new Error('bKash payment currency mismatch');
    }

    const isSuccessful =
      bkashData.transactionStatus?.toLowerCase() === 'completed';

    if (!isSuccessful) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: 'FAILED',
        },
      });

      throw new Error(
        `bKash payment was not completed: ${
          bkashData.transactionStatus || 'Unknown status'
        }`
      );
    }

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        transactionId: bkashData.trxID || paymentID,
      },
    });

    return bkashData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `bKash payment execution failed: ${
          error.response?.data?.statusMessage || error.message
        }`
      );
    }

    throw error;
  }
};

export const PaymentService = {
  createStripePayment,
  handleStripeWebhook,
  createBkashPayment,
  executeBkashPayment,
  handleBkashCallback,
  queryBkashPayment,
};
