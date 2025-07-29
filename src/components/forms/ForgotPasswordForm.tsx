import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, CardHeader, useToast } from '../ui';
import { useAuthStore } from '../../store';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../utils/validations';
import { ROUTES } from '../../constants';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    clearError();
    
    const success = await resetPassword(data.email);
    
    if (success) {
      toast.success(
        'Reset link sent!',
        'Please check your email for password reset instructions.'
      );
      onSuccess?.();
    } else if (error) {
      toast.error('Reset failed', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader
        title="Reset your password"
        subtitle="Enter your email address and we'll send you a link to reset your password."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          leftIcon={<EnvelopeIcon />}
          error={errors.email?.message}
          placeholder="Enter your email address"
          {...register('email')}
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Send reset link
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}