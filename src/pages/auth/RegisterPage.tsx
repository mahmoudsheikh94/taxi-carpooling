import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../../components/forms';
import { useAuthStore } from '../../store';
import { ROUTES } from '../../constants';

export function RegisterPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [user, navigate]);

  const handleSuccess = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}