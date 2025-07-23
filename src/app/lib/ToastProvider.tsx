"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';


type ToastType = 'info' | 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}
interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}
const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast(): ToastContextType {
  return useContext(ToastContext);
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              marginBottom: 8,
              padding: '12px 20px',
              borderRadius: 6,
              background: toast.type === 'error' ? '#f87171' : toast.type === 'success' ? '#4ade80' : '#60a5fa',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              minWidth: 200,
              fontWeight: 500,
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
