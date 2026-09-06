import { z } from 'zod';

const createAssessmentSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(2, 'Title must be at least 2 characters long')
        .max(200, 'Title must not exceed 200 characters'),

      description: z
        .string()
        .trim()
        .max(5000, 'Description must not exceed 5000 characters')
        .nullable()
        .optional(),

      instructions: z
        .string()
        .trim()
        .max(5000, 'Instructions must not exceed 5000 characters')
        .nullable()
        .optional(),

      durationMinutes: z
        .number()
        .int('Duration must be a whole number')
        .positive('Duration must be greater than 0'),

      totalMarks: z
        .number()
        .int('Total marks must be a whole number')
        .positive('Total marks must be greater than 0'),

      passingMarks: z
        .number()
        .int('Passing marks must be a whole number')
        .positive('Passing marks must be greater than 0'),

      startAt: z.coerce.date().nullable().optional(),

      endAt: z.coerce.date().nullable().optional(),
    })
    .refine((data) => data.passingMarks <= data.totalMarks, {
      message: 'Passing marks cannot exceed total marks',
      path: ['passingMarks'],
    })
    .refine(
      (data) => {
        if (!data.startAt || !data.endAt) {
          return true;
        }

        return data.endAt > data.startAt;
      },
      {
        message: 'End time must be later than start time',
        path: ['endAt'],
      }
    ),

  query: z.object({}),

  params: z.object({}),
});

const updateAssessmentSchema = z
  .object({
    params: z.object({
      assessmentId: z.string().uuid('Invalid assessment ID'),
    }),

    body: z.object({
      title: z
        .string()
        .trim()
        .min(2, 'Title must be at least 2 characters long')
        .max(200, 'Title must not exceed 200 characters')
        .optional(),

      description: z
        .string()
        .trim()
        .max(5000, 'Description must not exceed 5000 characters')
        .nullable()
        .optional(),

      instructions: z
        .string()
        .trim()
        .max(5000, 'Instructions must not exceed 5000 characters')
        .nullable()
        .optional(),

      durationMinutes: z
        .number()
        .int('Duration must be a whole number')
        .positive('Duration must be greater than 0')
        .optional(),

      totalMarks: z
        .number()
        .int('Total marks must be a whole number')
        .positive('Total marks must be greater than 0')
        .optional(),

      passingMarks: z
        .number()
        .int('Passing marks must be a whole number')
        .positive('Passing marks must be greater than 0')
        .optional(),

      startAt: z.coerce.date().nullable().optional(),

      endAt: z.coerce.date().nullable().optional(),
    }),
  })
  .refine((data) => Object.keys(data.body).length > 0, {
    message: 'At least one field is required for update',
    path: ['body'],
  });

const getAssessmentsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive number')
      .transform(Number)
      .refine((value) => value >= 1, {
        message: 'Page must be at least 1',
      })
      .optional()
      .default(1),

    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive number')
      .transform(Number)
      .refine((value) => value >= 1 && value <= 100, {
        message: 'Limit must be between 1 and 100',
      })
      .optional()
      .default(10),

    search: z.string().trim().min(1, 'Search value cannot be empty').optional(),

    status: z
      .enum(['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'ARCHIVED'])
      .optional(),

    sortBy: z
      .enum(['title', 'createdAt', 'updatedAt', 'startAt', 'endAt'])
      .optional()
      .default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

const getAssessmentByIdSchema = z.object({
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
  }),

  query: z.object({}),
});

const deleteAssessmentSchema = z.object({
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
  }),
});

const publishAssessmentSchema = z.object({
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
  }),

  query: z.object({}),

  body: z.object({}).optional(),
});

const createQuestionSchema = z
  .object({
    params: z.object({
      assessmentId: z.string().uuid('Invalid assessment ID'),
    }),

    body: z.object({
      questionText: z
        .string()
        .trim()
        .min(2, 'Question text must be at least 2 characters long')
        .max(10000, 'Question text must not exceed 10000 characters'),

      type: z.enum(['MCQ', 'WRITTEN', 'CODING']),

      marks: z
        .number()
        .int('Marks must be a whole number')
        .positive('Marks must be greater than 0'),

      order: z
        .number()
        .int('Order must be a whole number')
        .positive('Order must be greater than 0'),

      difficulty: z
        .enum(['EASY', 'MEDIUM', 'HARD'])
        .optional()
        .default('MEDIUM'),

      explanation: z
        .string()
        .trim()
        .max(5000, 'Explanation must not exceed 5000 characters')
        .nullable()
        .optional(),

      referenceAnswer: z
        .string()
        .trim()
        .max(10000, 'Reference answer must not exceed 10000 characters')
        .nullable()
        .optional(),

      options: z
        .array(
          z.object({
            optionText: z
              .string()
              .trim()
              .min(1, 'Option text cannot be empty')
              .max(1000, 'Option text must not exceed 1000 characters'),

            isCorrect: z.boolean().default(false),
          })
        )
        .optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.type !== 'MCQ') {
        return true;
      }

      return (
        data.body.options !== undefined &&
        data.body.options.length >= 2 &&
        data.body.options.some((option) => option.isCorrect)
      );
    },
    {
      message: 'MCQ must have at least 2 options and one correct option',
      path: ['body', 'options'],
    }
  );

const getQuestionsSchema = z.object({
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
  }),

  query: z.object({
    type: z.enum(['MCQ', 'WRITTEN', 'CODING']).optional(),

    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),

    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive number')
      .transform(Number)
      .refine((value) => value >= 1, {
        message: 'Page must be at least 1',
      })
      .optional()
      .default(1),

    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive number')
      .transform(Number)
      .refine((value) => value >= 1 && value <= 100, {
        message: 'Limit must be between 1 and 100',
      })
      .optional()
      .default(10),
  }),
});

const getQuestionByIdSchema = z.object({
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),

    questionId: z.string().uuid('Invalid question ID'),
  }),

  query: z.object({}),
});

const updateQuestionSchema = z
  .object({
    params: z.object({
      assessmentId: z.string().uuid('Invalid assessment ID'),
      questionId: z.string().uuid('Invalid question ID'),
    }),

    body: z.object({
      questionText: z
        .string()
        .trim()
        .min(2, 'Question text must be at least 2 characters long')
        .max(10000, 'Question text must not exceed 10000 characters')
        .optional(),

      type: z.enum(['MCQ', 'WRITTEN', 'CODING']).optional(),

      marks: z
        .number()
        .int('Marks must be a whole number')
        .positive('Marks must be greater than 0')
        .optional(),

      order: z
        .number()
        .int('Order must be a whole number')
        .positive('Order must be greater than 0')
        .optional(),

      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),

      explanation: z
        .string()
        .trim()
        .max(5000, 'Explanation must not exceed 5000 characters')
        .nullable()
        .optional(),

      referenceAnswer: z
        .string()
        .trim()
        .max(10000, 'Reference answer must not exceed 10000 characters')
        .nullable()
        .optional(),

      options: z
        .array(
          z.object({
            optionText: z
              .string()
              .trim()
              .min(1, 'Option text cannot be empty')
              .max(1000, 'Option text must not exceed 1000 characters'),

            isCorrect: z.boolean().default(false),
          })
        )
        .optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.type !== 'MCQ' || data.body.options === undefined) {
        return true;
      }

      return (
        data.body.options.length >= 2 &&
        data.body.options.some((option) => option.isCorrect)
      );
    },
    {
      message: 'MCQ must have at least 2 options and one correct option',
      path: ['body', 'options'],
    }
  );

const deleteQuestionSchema = z.object({
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
    questionId: z.string().uuid('Invalid question ID'),
  }),

  query: z.object({}),
});

export const AssessmentValidation = {
  createAssessmentSchema,
  updateAssessmentSchema,
  getAssessmentsSchema,
  getAssessmentByIdSchema,
  deleteAssessmentSchema,
  publishAssessmentSchema,
  createQuestionSchema,
  getQuestionsSchema,
  getQuestionByIdSchema,
  updateQuestionSchema,
  deleteQuestionSchema,
};
