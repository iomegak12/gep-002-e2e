import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Lock,
  ShieldCheck,
  ShoppingCart,
  Crown,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/layout/Brand';
import { BrandCarousel } from './BrandCarousel';
import { Card, CardBody } from '@/components/primitives/Card';
import { Field } from '@/components/primitives/Field';
import { Input } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import { Checkbox } from '@/components/primitives/Checkbox';
import { Tooltip } from '@/components/primitives/Tooltip';
import { authApi } from '@/api/authApi';
import { qk } from '@/api/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { loginSchema } from '@/lib/schemas/authSchemas';
import { ERR, getErrorCode, getErrorMessage } from '@/lib/apiError';

export function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const SAMPLE_USERS = [
    {
      key: 'admin',
      email: 'admin@demo.local',
      password: 'Passw0rd!',
      label: 'Admin · admin@demo.local',
      icon: ShieldCheck,
    },
    {
      key: 'buyer',
      email: 'buyer@demo.local',
      password: 'Passw0rd!',
      label: 'Buyer · buyer@demo.local',
      icon: ShoppingCart,
    },
    {
      key: 'approver-hi',
      email: 'approver-hi@demo.local',
      password: 'Passw0rd!',
      label: 'Approver (limit 1,000,000) · approver-hi@demo.local',
      icon: Crown,
    },
    {
      key: 'approver-lo',
      email: 'approver-lo@demo.local',
      password: 'Passw0rd!',
      label: 'Approver (limit 50,000) · approver-lo@demo.local',
      icon: ClipboardList,
    },
  ];

  function fillSample(sample) {
    setValue('email', sample.email, { shouldDirty: true, shouldValidate: false });
    setValue('password', sample.password, { shouldDirty: true, shouldValidate: false });
    setServerError('');
  }

  const login = useMutation({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: (data) => {
      const token = data?.access_token || data?.token;
      if (!token) {
        setServerError('Login response did not include a token.');
        return;
      }
      setToken(token);
      if (data?.user) {
        setUser(data.user);
        qc.setQueryData(qk.auth.me, data.user);
      }
      toast.success('Welcome back');
      const from = params.get('from');
      navigate(from && from.startsWith('/') ? from : '/', { replace: true });
    },
    onError: (err) => {
      // Contract: gep-back-end/tests/src/tests/iam/login.spec.js
      // AUTH_FAILED (401) for wrong creds, VALIDATION_FAILED (400) for missing fields.
      const code = getErrorCode(err);
      if (code === ERR.AUTH_FAILED) {
        setServerError('Email or password is incorrect. Try again or contact your administrator.');
      } else if (code === ERR.VALIDATION_FAILED) {
        setServerError('Please fill in both your email and password.');
      } else {
        setServerError(getErrorMessage(err, 'Sign-in failed. Please try again.'));
      }
    },
  });

  function onSubmit(values) {
    setServerError('');
    login.mutate({ email: values.email, password: values.password });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-12 px-6 py-10 md:grid-cols-2">
        {/* Left brand panel — animated carousel */}
        <BrandCarousel className="hidden md:block" />

        {/* Right login card */}
        <Card className="w-full">
          <CardBody className="p-8">
            <div className="mb-4 flex flex-col items-start md:hidden">
              <Brand size="sm" />
            </div>
            <h2 className="text-headline-md text-on-surface">Sign in</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Use your work email and password.
            </p>

            {serverError ? (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-lg border border-error-container bg-error-container/40 p-3 text-on-error-container"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="text-body-base font-medium">Sign-in failed</div>
                  <div className="text-body-sm">{serverError}</div>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4" noValidate>
              <Field label="Email" required error={errors.email?.message}>
                {({ id, invalid }) => (
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <Input
                      id={id}
                      type="email"
                      autoComplete="email"
                      placeholder="you@order-oasis.example"
                      invalid={invalid}
                      className="pl-9"
                      {...register('email')}
                    />
                  </div>
                )}
              </Field>

              <Field
                label="Password"
                required
                error={errors.password?.message}
              >
                {({ id, invalid }) => (
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <Input
                      id={id}
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      invalid={invalid}
                      className="pl-9 pr-9"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </Field>

              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <Checkbox {...register('remember')} />
                <span>Keep me signed in on this device</span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting || login.isPending}
                leftIcon={<LogIn className="h-4 w-4" />}
              >
                {login.isPending ? 'Signing in…' : 'Sign in'}
              </Button>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-label-caps uppercase text-on-surface-variant">
                  Quick fill
                </span>
                <div className="h-px flex-1 bg-outline-variant" />
                <div className="flex items-center gap-1.5">
                  {SAMPLE_USERS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <Tooltip key={s.key} label={s.label} side="top">
                        <button
                          type="button"
                          aria-label={`Fill credentials for ${s.label}`}
                          onClick={() => fillSample(s)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </form>

            <div className="my-6 h-px bg-outline-variant" />
            <p className="text-center text-body-sm text-on-surface-variant">
              Trouble signing in? Contact{' '}
              <Link to="#" className="text-primary hover:underline">
                support@order-oasis.example
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
