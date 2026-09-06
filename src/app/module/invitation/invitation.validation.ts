import { z } from 'zod';

const createInvitationSchema = z.object({
  body: z.object({
    candidateId: z.string().uuid('Invalid candidate ID'),

    assessmentId: z.string().uuid('Invalid assessment ID'),

    message: z
      .string()
      .trim()
      .max(1000, 'Message must not exceed 1000 characters')
      .nullable()
      .optional(),

    expiresAt: z.coerce.date().nullable().optional(),
  }),

  query: z.object({}),

  params: z.object({}),
});

export { createInvitationSchema };
