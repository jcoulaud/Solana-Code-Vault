import { toast } from 'react-hot-toast';

export const useToast = () => ({
  success: (message: string) => toast.success(message, { position: 'top-center' }),
  error: (message: string) => toast.error(message, { position: 'top-center' }),
  info: (message: string) => toast(message, { position: 'top-center' }),
});
