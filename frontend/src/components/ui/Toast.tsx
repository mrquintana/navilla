import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import type { ToastType } from '../../contexts/ToastContext';

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styleMap: Record<ToastType, string> = {
  success:
    'bg-green-50 border-green-300 text-green-800',
  error:
    'bg-red-50 border-red-300 text-red-800',
  info:
    'bg-indigo-50 border-indigo-300 text-indigo-800',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-indigo-600',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      data-testid="toast-container"
    >
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            role="status"
            className={`animate-slide-in pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styleMap[toast.type]}`}
            data-testid={`toast-${toast.type}`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColorMap[toast.type]}`} aria-hidden="true" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-0.5 hover:bg-black/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
