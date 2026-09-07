import { z } from 'zod';

const createStripePaymentSchema = z.object({
  body: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const PaymentValidation = {
  createStripePaymentSchema,
};
