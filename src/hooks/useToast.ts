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
  
  // Legacy showToast method for backward compatibility
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    addToast({ type, title: message });
  };
  
  return {
    success,
    error,
    warning,
    info,
    showToast,
  };
};