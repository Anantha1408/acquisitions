import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'no update fields provided',
  });

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
