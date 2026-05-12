import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardBody } from '@/components/primitives/Card';
import { Field } from '@/components/primitives/Field';
import { Input } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import { Pill } from '@/components/primitives/Pill';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/stores/authStore';
import { changePasswordSchema } from '@/lib/schemas/authSchemas';
import { ERR, getErrorCode, getErrorMessage } from '@/lib/apiError';
import { ROLE_LABELS } from '@/constants/roles';

function PasswordInput({ id, invalid, register, name, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        invalid={invalid}
        className="pl-9 pr-9"
        {...register(name)}
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

export function ChangePasswordPage() {
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const mutation = useMutation({
    mutationFn: (payload) => authApi.changeMyPassword(payload),
    onSuccess: () => {
      toast.success('Password updated');
      reset();
    },
    onError: (err) => {
      const code = getErrorCode(err);
      if (code === ERR.AUTH_FAILED) {
        toast.error('Current password is incorrect.');
      } else if (code === ERR.VALIDATION_FAILED) {
        toast.error(getErrorMessage(err, 'Password does not meet requirements.'));
      } else {
        toast.error(getErrorMessage(err, 'Could not update password. Please try again.'));
      }
    },
  });

  function onSubmit(values) {
    mutation.mutate({
      current_password: values.current_password,
      new_password: values.new_password,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-widget-gap lg:grid-cols-3">
      {/* Account summary (read-only) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <h3 className="text-title-sm text-on-surface">Account</h3>
          <span className="text-label-caps uppercase text-on-surface-variant">
            Managed by your administrator
          </span>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full name">
            <Input value={user?.full_name || ''} readOnly />
          </Field>
          <Field label="Email">
            <Input value={user?.email || ''} readOnly />
          </Field>
          <Field label="Roles">
            <div className="flex flex-wrap items-center gap-2 py-1">
              {(user?.roles || []).map((r) => (
                <Pill key={r}>{ROLE_LABELS[r] || r}</Pill>
              ))}
            </div>
          </Field>
          <Field label="Approval limit">
            <Input
              value={
                user?.approval_limit !== null && user?.approval_limit !== undefined
                  ? new Intl.NumberFormat().format(user.approval_limit)
                  : '—'
              }
              readOnly
            />
          </Field>
        </CardBody>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 text-title-sm text-on-surface">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Tips
          </h3>
        </CardHeader>
        <CardBody>
          <ul className="list-disc space-y-2 pl-5 text-body-sm text-on-surface-variant">
            <li>Don't reuse passwords from other work accounts.</li>
            <li>A passphrase of four random words beats a short complex password.</li>
            <li>If an admin reset your account, change the temporary password immediately.</li>
          </ul>
        </CardBody>
      </Card>

      {/* Change password */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <h3 className="text-title-sm text-on-surface">Change password</h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Field label="Current password" required error={errors.current_password?.message}>
              {({ id, invalid }) => (
                <PasswordInput
                  id={id}
                  invalid={invalid}
                  register={register}
                  name="current_password"
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                />
              )}
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="New password"
                required
                error={errors.new_password?.message}
                help="At least 8 characters. Mix letters, numbers and symbols."
              >
                {({ id, invalid }) => (
                  <PasswordInput
                    id={id}
                    invalid={invalid}
                    register={register}
                    name="new_password"
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                  />
                )}
              </Field>
              <Field
                label="Confirm new password"
                required
                error={errors.confirm_password?.message}
              >
                {({ id, invalid }) => (
                  <PasswordInput
                    id={id}
                    invalid={invalid}
                    register={register}
                    name="confirm_password"
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                  />
                )}
              </Field>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => reset()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save new password'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
