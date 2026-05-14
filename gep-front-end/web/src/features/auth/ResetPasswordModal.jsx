import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/primitives/Modal';
import { Field } from '@/components/primitives/Field';
import { Input } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import { authApi } from '@/api/authApi';
import { adminResetPasswordSchema } from '@/lib/schemas/authSchemas';
import { getErrorMessage } from '@/lib/apiError';

function PasswordInput({ id, invalid, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        invalid={invalid}
        className="pl-9 pr-9"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * Admin-only modal for setting a temporary password on another user account.
 * Backed by POST /auth/users/{id}/reset-password.
 */
export function ResetPasswordModal({ open, onClose, user, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const mutation = useMutation({
    // POST /api/v1/auth/users/{id}/reset-password expects { password }, returns 204.
    // Contract: tests/api/src/tests/iam/users-admin.spec.js
    mutationFn: (payload) => authApi.resetUserPassword(user.id, payload),
    onSuccess: () => {
      toast.success(`Temporary password set for ${user?.full_name || user?.email}.`);
      onSuccess?.();
      onClose?.();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Could not reset password. Please try again.'));
    },
  });

  function onSubmit(values) {
    mutation.mutate({ password: values.new_password });
  }

  return (
    <Modal
      open={open && Boolean(user)}
      onClose={onClose}
      title="Reset user password"
      description={
        user
          ? `Set a temporary password for ${user.full_name || user.email}. Share it with them through a secure channel.`
          : undefined
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Reset password'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Field
          label="New password"
          required
          error={errors.new_password?.message}
          help="At least 8 characters. The user must change it on next login."
        >
          {({ id, invalid }) => (
            <PasswordInput
              id={id}
              invalid={invalid}
              autoComplete="new-password"
              placeholder="Temporary password"
              {...register('new_password')}
            />
          )}
        </Field>
        <Field label="Confirm password" required error={errors.confirm_password?.message}>
          {({ id, invalid }) => (
            <PasswordInput
              id={id}
              invalid={invalid}
              autoComplete="new-password"
              placeholder="Repeat the password"
              {...register('confirm_password')}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
