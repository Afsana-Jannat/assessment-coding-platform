import { z } from 'zod';

const auditLogQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 1))
      .refine((value) => Number.isInteger(value) && value > 0, {
        message: 'Page must be a positive integer',
      }),

    limit: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 10))
      .refine((value) => Number.isInteger(value) && value > 0 && value <= 100, {
        message: 'Limit must be between 1 and 100',
      }),

    action: z.string().optional(),

    entity: z.string().optional(),

    userId: z.string().uuid().optional(),

    from: z
      .string()
      .optional()
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
        message: 'Invalid from date',
      }),

    to: z
      .string()
      .optional()
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
        message: 'Invalid to date',
      }),
  }),
});

export const AuditLogValidation = {
  auditLogQuerySchema,
};
