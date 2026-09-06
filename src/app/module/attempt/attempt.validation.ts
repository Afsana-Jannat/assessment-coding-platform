import { z } from 'zod';

const startAttemptSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
  }),
});

const submitAttemptSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    attemptId: z.string().uuid('Invalid attempt ID'),
  }),
});

export { startAttemptSchema, submitAttemptSchema };
