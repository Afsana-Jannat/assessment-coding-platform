import { z } from 'zod';

const registerCandidateSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name must not exceed 100 characters'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),

    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password must not exceed 100 characters'),
  }),
});

const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),

    password: z.string().min(1, 'Password is required'),
  }),
});

const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
  }),
});

export const AuthValidation = {
  registerCandidateSchema,
  loginUserSchema,
  googleLoginSchema,
};
