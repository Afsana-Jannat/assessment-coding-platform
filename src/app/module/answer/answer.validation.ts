import { z } from 'zod';

const createAnswerSchema = z.object({
  body: z.object({
    attemptId: z.string().uuid('Invalid attempt ID'),
    questionId: z.string().uuid('Invalid question ID'),
    answerText: z.string().optional(),
    selectedOptionId: z.string().uuid('Invalid option ID').optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export { createAnswerSchema };
