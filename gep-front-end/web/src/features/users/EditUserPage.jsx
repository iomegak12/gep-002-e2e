import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ErrorState } from '@/components/data/ErrorState';
import { UserFormFields } from './components/UserFormFields';
import { ResetPasswordModal } from '@/features/auth/ResetPasswordModal';
import { authApi } from '@/api/authApi';
import { qk } from '@/api/queryKeys';
import { userUpdateSchema } from '@/lib/schemas/userSchemas';
import { ERR, isErrorCode, getErrorMessage } from '@/lib/apiError';

export function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [resetOpen, setResetOpen] = useState(false);

  const detail = useQuery({
    queryKey: qk.auth.user(id),
    queryFn: () => authApi.getUser(id),
    enabled: Boolean(id),
  });

  const form = useForm({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      email: '',
      full_name: '',
      roles: [],
      approval_limit: null,
      is_active: true,
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!detail.data) return;
    form.reset({
      email: detail.data.email,
      full_name: detail.data.full_name || '',
      roles: detail.data.roles || [],
      approval_limit: detail.data.approval_limit ?? null,
      is_active: Boolean(detail.data.is_active),
    });
  }, [detail.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useMutation({
    mutationFn: (payload) => authApi.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.auth.user(id) });
      qc.invalidateQueries({ queryKey: ['auth', 'users'] });
      toast.success('User updated');
      navigate('/users');
    },
    onError: (err) => {
      if (isErrorCode(err, ERR.VALIDATION_FAILED)) {
        toast.error(getErrorMessage(err, 'Some fields are invalid.'));
      } else if (isErrorCode(err, ERR.USER_NOT_FOUND)) {
        toast.error('That user no longer exists.');
      } else {
        toast.error(getErrorMessage(err, 'Could not update user. Please try again.'));
      }
    },
  });

  function onSubmit(values) {
    // email is immutable; never send it. Drop approval_limit when not an approver.
    // eslint-disable-next-line no-unused-vars
    const { email, ...rest } = values;
    if (!rest.roles?.includes('APPROVER')) rest.approval_limit = null;
    update.mutate(rest);
  }

  if (detail.isError) return <ErrorState onRetry={detail.refetch} />;
  if (detail.isLoading || !detail.data) return <Skeleton className="h-96 w-full" />;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardHeader>
            <h3 className="text-title-sm text-on-surface">
              Edit {detail.data.full_name || detail.data.email}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<KeyRound className="h-4 w-4" />}
              onClick={() => setResetOpen(true)}
            >
              Reset password
            </Button>
          </CardHeader>
          <CardBody>
            <UserFormFields mode="edit" />
          </CardBody>
          <CardFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => navigate('/users')}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <ResetPasswordModal
        open={resetOpen}
        user={detail.data}
        onClose={() => setResetOpen(false)}
      />
    </FormProvider>
  );
}
