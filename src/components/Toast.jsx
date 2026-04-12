/* Toast notification system */
import React, { createContext, useContext, useCallback } from 'react';
import { X } from 'lucide-react';
import useUIStore from '../stores/uiStore';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toasts = useUIStore((s) => s.toasts);
  const addToast = useUIStore((s) => s.addToast);
  const removeToast = useUIStore((s) => s.removeToast);

  const toast = useCallback(
    (message, type = 'info', duration = 4000) => addToast({ message, type, duration }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{t.message}</span>
            <button
              className="btn-icon-sm btn-ghost"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
