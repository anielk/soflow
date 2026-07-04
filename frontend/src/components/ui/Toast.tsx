'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastRecord {
  id:      string;
  message: string;
  tone:    ToastTone;
  leaving: boolean;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;
const EXIT_DURATION_MS = 200;

const TONE_ICON: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error:   AlertCircle,
  info:    Info,
};

const TONE_ICON_CLASS: Record<ToastTone, string> = {
  success: 'text-success-text',
  error:   'text-danger-text',
  info:    'text-violet-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const reducedMotionRef = useRef(false);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useLayoutEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const remove = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      if (reducedMotionRef.current) {
        remove(id);
        return;
      }
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      const timer = setTimeout(() => remove(id), EXIT_DURATION_MS);
      timersRef.current.set(id, timer);
    },
    [remove],
  );

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, tone, leaving: false }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 w-full max-w-xs pointer-events-none"
      >
        {toasts.map((toast) => {
          const Icon = TONE_ICON[toast.tone];
          return (
            <div
              key={toast.id}
              className={[
                'pointer-events-auto flex items-start gap-2.5 bg-bg-overlay border border-bg-border rounded-lg px-3.5 py-3 shadow-dropdown transition-all duration-200',
                reducedMotionRef.current ? '' : toast.leaving ? 'opacity-0 translate-x-2' : 'animate-slide-in-right opacity-100',
              ].join(' ')}
            >
              <Icon size={16} className={['shrink-0 mt-0.5', TONE_ICON_CLASS[toast.tone]].join(' ')} />
              <p className="flex-1 text-sm text-text-primary leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-text-muted hover:text-text-primary transition-colors duration-150"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
