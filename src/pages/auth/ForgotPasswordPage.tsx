import { useNavigate } from 'react-router-dom';
import { ForgotPasswordForm } from '../../components/forms';
import { ROUTES } from '../../constants';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <ForgotPasswordForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}