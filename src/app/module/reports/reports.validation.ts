import { z } from 'zod';

const dateFilterSchema = z.object({
  query: z.object({
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

export const ReportsValidation = {
  dateFilterSchema,
};
