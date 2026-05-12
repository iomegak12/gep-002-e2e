import { useFormContext, useWatch } from 'react-hook-form';
import { Field } from '@/components/primitives/Field';
import { Input } from '@/components/primitives/Input';
import { Checkbox } from '@/components/primitives/Checkbox';
import { Chip } from '@/components/primitives/Chip';
import { ALL_ROLES, ROLE_LABELS } from '@/constants/roles';

/**
 * Re-usable fieldset for Create + Edit user forms.
 * `mode` = 'create' shows email+password; 'edit' hides password and locks email.
 */
export function UserFormFields({ mode = 'create' }) {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext();

  const roles = useWatch({ name: 'roles' }) || [];

  function toggleRole(role) {
    const next = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
    setValue('roles', next, { shouldDirty: true, shouldValidate: true });
  }

  const isApprover = roles.includes('APPROVER');

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Email" required error={errors.email?.message}>
          {({ id, invalid }) => (
            <Input
              id={id}
              type="email"
              invalid={invalid}
              readOnly={mode === 'edit'}
              placeholder="user@order-oasis.example"
              {...register('email')}
            />
          )}
        </Field>
        <Field label="Full name" required error={errors.full_name?.message}>
          {({ id, invalid }) => (
            <Input id={id} invalid={invalid} placeholder="Priya Ramesh" {...register('full_name')} />
          )}
        </Field>
      </div>

      {mode === 'create' ? (
        <Field
          label="Initial password"
          required
          error={errors.password?.message}
          help="At least 8 characters. Share this with the user through a secure channel."
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              type="password"
              invalid={invalid}
              autoComplete="new-password"
              {...register('password')}
            />
          )}
        </Field>
      ) : null}

      <Field
        label="Roles"
        required
        error={typeof errors.roles?.message === 'string' ? errors.roles.message : undefined}
        help="Pick one or more. Approvers must also have an approval limit."
      >
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => (
            <Chip key={role} selected={roles.includes(role)} onClick={() => toggleRole(role)}>
              {ROLE_LABELS[role]}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Approval limit"
          required={isApprover}
          error={errors.approval_limit?.message}
          help={
            isApprover
              ? 'Maximum PO total this user can approve.'
              : 'Only required when the user is an approver.'
          }
        >
          {({ id, invalid }) => (
            <Input
              id={id}
              type="number"
              step="1"
              min="0"
              invalid={invalid}
              placeholder="e.g. 100000"
              {...register('approval_limit', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Active" help="Inactive users cannot sign in.">
          <label className="flex h-9 items-center gap-2 text-body-base text-on-surface">
            <Checkbox {...register('is_active')} />
            <span>Allow this user to sign in</span>
          </label>
        </Field>
      </div>
    </div>
  );
}
