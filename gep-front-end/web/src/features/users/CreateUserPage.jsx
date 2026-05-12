import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { UserFormFields } from './components/UserFormFields';
import { authApi } from '@/api/authApi';
import { userCreateSchema, userCreateDefaults } from '@/lib/schemas/userSchemas';
import { ERR, isErrorCode, getErrorMessage } from '@/lib/apiError';

export function CreateUserPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const form = useForm({
    resolver: zodResolver(userCreateSchema),
    defaultValues: userCreateDefaults,
    mode: 'onBlur',
  });

  const create = useMutation({
    mutationFn: (payload) => authApi.createUser(payload),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['auth', 'users'] });
      toast.success(`Invited ${created.full_name || created.email}`);
      navigate('/users');
    },
    onError: (err) => {
      // Contract: gep-back-end/tests/src/tests/iam/users-admin.spec.js
      if (isErrorCode(err, ERR.DUPLICATE_RESOURCE)) {
        toast.error('That email is already in use.');
      } else if (isErrorCode(err, ERR.VALIDATION_FAILED)) {
        toast.error(getErrorMessage(err, 'Some fields are invalid.'));
      } else {
        toast.error(getErrorMessage(err, 'Could not create user. Please try again.'));
      }
    },
  });

  function onSubmit(values) {
    // approval_limit is required by Zod refine when APPROVER is selected; otherwise drop it.
    const payload = { ...values };
    if (!payload.roles.includes('APPROVER')) {
      delete payload.approval_limit;
    }
    create.mutate(payload);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">New user</h3>
            <span className="text-label-caps uppercase text-on-surface-variant">
              Admin only
            </span>
          </CardHeader>
          <CardBody>
            <UserFormFields mode="create" />
          </CardBody>
          <CardFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => navigate('/users')}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={create.isPending}>
              {create.isPending ? 'Inviting…' : 'Invite user'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
