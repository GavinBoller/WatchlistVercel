import { useState } from 'react';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = ({ title, description, variant }: ToastProps) => {
    setToasts((prev) => [...prev, { title, description, variant }]);
  };

  return { toast, toasts };
}
