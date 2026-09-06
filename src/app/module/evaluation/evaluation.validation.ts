import { z } from 'zod';

const createEvaluationSchema = z.object({
  body: z.object({
    answerId: z.string().uuid('Invalid answer ID'),

    marksObtained: z
      .number()
      .int('Marks must be an integer')
      .min(0, 'Marks cannot be negative'),

    feedback: z
      .string()
      .trim()
      .max(1000, 'Feedback cannot exceed 1000 characters')
      .optional(),
  }),

  query: z.object({}),

  params: z.object({}),
});

export { createEvaluationSchema };
