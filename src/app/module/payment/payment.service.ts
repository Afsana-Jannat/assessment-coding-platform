import Stripe from 'stripe';

import config from '../../config';
import { prisma } from '../../lib/prisma';
import { ICreateStripePayment } from './payment.interface';
import axios from 'axios';

const getBkashToken = async (): Promise<string> => {
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

  return response.data.id_token;
};

const stripe = new Stripe(config.stripe_secret_key);

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

      success_url: `${config.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${config.frontend_url}/payment/cancel`,

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

const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string | string[]
) => {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripe_webhook_secret
  );

  // Handle successful Checkout payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const paymentId = session.metadata?.paymentId;

    if (!paymentId) {
      throw new Error('Payment ID missing from Stripe metadata');
    }

    // Find our payment
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    // If webhook is delivered multiple times
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

    // Update our database
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

export const PaymentService = {
  createStripePayment,
  handleStripeWebhook,
};
