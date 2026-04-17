import { useCallback, useEffect, useState } from 'react';

export interface ToastMessage {
  id: number;
  body: string;
  tone: 'info' | 'warn' | 'error';
}

let nextId = 1;

/**
 * Global toast queue (module-scoped). One toast at a time is fine for the Phase-8
 * fallback UX. If a new toast arrives while another is visible, the old one is replaced.
 */
const listeners = new Set<(msg: ToastMessage | null) => void>();
let current: ToastMessage | null = null;

export function pushToast(body: string, tone: ToastMessage['tone'] = 'info'): void {
  current = { id: nextId++, body, tone };
  listeners.forEach((fn) => fn(current));
}

export function dismissToast(): void {
  current = null;
  listeners.forEach((fn) => fn(null));
}

export function useToast(): ToastMessage | null {
  const [msg, setMsg] = useState<ToastMessage | null>(current);
  useEffect(() => {
    listeners.add(setMsg);
    return () => {
      listeners.delete(setMsg);
    };
  }, []);
  return msg;
}

/**
 * Fixed-position dismissible toast. Auto-dismisses after 5 seconds.
 */
export function Toast() {
  const msg = useToast();
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => dismissToast(), 5000);
    return () => clearTimeout(t);
  }, [msg?.id]);

  const onClose = useCallback(() => dismissToast(), []);

  if (!msg) return null;
  return (
    <div className={`toast toast--${msg.tone}`} role="status" aria-live="polite">
      <span className="toast__body">{msg.body}</span>
      <button type="button" className="toast__close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
    </div>
  );
}
