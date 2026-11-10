"use client";

import * as React from "react";
import {
  CheckCircleIcon,
  CloseIcon,
  DangerCircleIcon,
  DangerTriangleIcon,
  InfoCircleIcon,
} from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "info" | "warning" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastRecord {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export interface UseToastReturn {
  toast: (options: ToastOptions | string) => string;
  dismiss: (id: string) => void;
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastContext = React.createContext<UseToastReturn>({
  toast: () => "",
  dismiss: () => {},
});

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 3;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const iconClassName = "mt-0.5 size-4 shrink-0";

  switch (variant) {
    case "success":
      return (
        <CheckCircleIcon
          className={cn(iconClassName, "text-emerald-600")}
          aria-hidden="true"
        />
      );
    case "warning":
      return (
        <DangerTriangleIcon
          className={cn(iconClassName, "text-amber-600")}
          aria-hidden="true"
        />
      );
    case "danger":
      return (
        <DangerCircleIcon
          className={cn(iconClassName, "text-red-600")}
          aria-hidden="true"
        />
      );
    case "info":
    default:
      return (
        <InfoCircleIcon
          className={cn(iconClassName, "text-sky-600")}
          aria-hidden="true"
        />
      );
  }
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const counterRef = React.useRef(0);
  const timersRef = React.useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (options: ToastOptions | string) => {
      const normalized: ToastOptions =
        typeof options === "string" ? { title: options } : options;

      counterRef.current += 1;
      const id = `toast-${counterRef.current}`;
      const record: ToastRecord = {
        id,
        title: normalized.title,
        description: normalized.description,
        variant: normalized.variant ?? "info",
      };

      setToasts((current) => [...current, record].slice(-MAX_VISIBLE));

      const timer = setTimeout(
        () => dismiss(id),
        normalized.duration ?? DEFAULT_DURATION
      );
      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss]
  );

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.variant === "danger" ? "alert" : "status"}
            aria-live={item.variant === "danger" ? "assertive" : "polite"}
            className="flex items-start gap-3 rounded-md border border-hospital-border bg-white p-3 shadow-lg"
          >
            <ToastIcon variant={item.variant} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-hospital-text">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-0.5 text-xs text-hospital-text-muted">
                  {item.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-hospital-text-muted transition-colors hover:bg-hospital-surface-muted hover:text-hospital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1 cursor-pointer"
            >
              <CloseIcon className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): UseToastReturn {
  return React.useContext(ToastContext);
}
