import { z } from 'zod';
import { ALL_ROLES } from '@/constants/roles';

const emptyToUndef = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const toNumber = (v) =>
  v === '' || v === null || v === undefined ? undefined : typeof v === 'string' ? Number(v) : v;

const baseUserShape = {
  email: z.string().trim().min(1, 'Required').email('Enter a valid email').max(120),
  full_name: z.string().trim().min(2, 'Required').max(120),
  roles: z
    .array(z.enum(ALL_ROLES))
    .min(1, 'Pick at least one role'),
  approval_limit: z.preprocess(
    toNumber,
    z.number({ invalid_type_error: 'Enter a numeric limit' }).positive('Must be > 0').optional().nullable()
  ),
  is_active: z.boolean().optional(),
};

export const userCreateSchema = z
  .object({
    ...baseUserShape,
    password: z.string().min(8, 'At least 8 characters').max(128),
  })
  .refine(
    (d) => !d.roles.includes('APPROVER') || (d.approval_limit != null && d.approval_limit > 0),
    {
      path: ['approval_limit'],
      message: 'Approval limit is required for approvers',
    }
  );

export const userUpdateSchema = z
  .object({
    ...baseUserShape,
    full_name: baseUserShape.full_name.optional(),
    roles: baseUserShape.roles.optional(),
  })
  .refine(
    (d) =>
      !d.roles || !d.roles.includes('APPROVER') || (d.approval_limit != null && d.approval_limit > 0),
    {
      path: ['approval_limit'],
      message: 'Approval limit is required for approvers',
    }
  );

export const userCreateDefaults = {
  email: '',
  full_name: '',
  password: '',
  roles: ['BUYER'],
  approval_limit: null,
  is_active: true,
};
