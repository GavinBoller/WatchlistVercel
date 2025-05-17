import { useState } from 'react';

export interface Toast {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: React.ReactNode;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);

  const toast = ({ title, description, variant = 'default', duration = 5000, action }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, title, description, variant, duration, action };
    setToasts((prev) => [...prev, newToast]);
    setCurrentToast(newToast);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setCurrentToast(null);
    }, duration);
  };

  return { toast, toasts, currentToast };
};
