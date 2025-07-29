import { useToastStore } from '../store/toastStore';

export const useToast = () => {
  const { success, error, warning, info } = useToastStore();
  
  return {
    success,
    error,
    warning,
    info,
    showToast: success, // Alias for compatibility
  };
};