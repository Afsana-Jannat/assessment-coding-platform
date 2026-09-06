import { z } from 'zod';

const startAttemptSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
  }),
});

export { startAttemptSchema };
