import { useToastStore } from '../store/toastStore';

export const useToast = () => {
  const { addToast } = useToastStore();
  
  const success = (title: string, message?: string) => 
    addToast({ type: 'success', title, message });
  
  const error = (title: string, message?: string) => 
    addToast({ type: 'error', title, message });
  
  const warning = (title: string, message?: string) => 
    addToast({ type: 'warning', title, message });
  
  const info = (title: string, message?: string) => 
    addToast({ type: 'info', title, message });
  
  return {
    success,
    error,
    warning,
    info,
    showToast: success, // Alias for compatibility
  };
};