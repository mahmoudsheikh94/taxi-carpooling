import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, CardHeader, useToast } from '../ui';
import { useAuthStore } from '../../store';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../utils/validations';
import { ROUTES } from '../../constants';

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { updatePassword, isLoading, error, clearError } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    clearError();
    
    const success = await updatePassword(data.password);
    
    if (success) {
      toast.success(
        'Password updated!',
        'Your password has been successfully updated.'
      );
      navigate(ROUTES.DASHBOARD);
    } else if (error) {
      toast.error('Password update failed', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader
        title="Set new password"
        subtitle="Enter your new password below."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          leftIcon={<LockClosedIcon />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          }
          error={errors.password?.message}
          helperText="Must be at least 8 characters with uppercase, lowercase, and number"
          {...register('password')}
        />

        <Input
          label="Confirm new password"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          leftIcon={<LockClosedIcon />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Update password
        </Button>
      </form>
    </Card>
  );
}