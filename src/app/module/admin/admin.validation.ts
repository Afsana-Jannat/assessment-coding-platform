import { z } from 'zod';

const createRecruiter = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    phone: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    companyWebsite: z
      .string()
      .trim()
      .url('Please provide a valid company website URL')
      .optional(),
    companyDescription: z.string().trim().optional(),
  }),
});

const getRecruiters = z.object({
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

    sortBy: z
      .enum(['name', 'email', 'companyName', 'createdAt', 'updatedAt'])
      .optional()
      .default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

const getCandidates = z.object({
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

    status: z.enum(['ACTIVE', 'BLOCKED', 'DELETED']).optional(),

    sortBy: z
      .enum(['name', 'email', 'createdAt', 'updatedAt'])
      .optional()
      .default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

const getCandidateById = z.object({
  params: z.object({
    id: z.string().uuid('Invalid candidate ID'),
  }),
});

const updateRecruiterStatus = z.object({
  params: z.object({
    id: z.string().uuid('Invalid recruiter ID'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'BLOCKED'], {
      message: 'Status must be either ACTIVE or BLOCKED',
    }),
  }),
});

const updateCandidate = z.object({
  params: z.object({
    id: z.string().uuid('Invalid candidate ID'),
  }),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters long')
        .max(100, 'Name must not exceed 100 characters')
        .optional(),

      phone: z
        .string()
        .trim()
        .regex(/^[0-9+\-\s()]{7,20}$/, 'Please provide a valid phone number')
        .nullable()
        .optional(),

      address: z
        .string()
        .trim()
        .max(500, 'Address must not exceed 500 characters')
        .nullable()
        .optional(),

      gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),

      dateOfBirth: z.coerce.date().nullable().optional(),

      skills: z
        .array(z.string().trim().min(1, 'Skill cannot be empty'))
        .max(20, 'You can add up to 20 skills')
        .optional(),

      experience: z
        .string()
        .trim()
        .max(2000, 'Experience must not exceed 2000 characters')
        .nullable()
        .optional(),

      education: z
        .string()
        .trim()
        .max(2000, 'Education must not exceed 2000 characters')
        .nullable()
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required for update',
    }),
});

const updateCandidateStatus = z.object({
  params: z.object({
    id: z.string().uuid('Invalid candidate ID'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'BLOCKED'], {
      message: 'Status must be either ACTIVE or BLOCKED',
    }),
  }),
});

export const AdminValidation = {
  createRecruiter,
  getRecruiters,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  updateRecruiterStatus,
};
