import { useCallback, useEffect, useState } from 'react';

export interface ToastMessage {
  id: number;
  body: string;
  tone: 'info' | 'warn' | 'error';
}

/**
 * Minimum visibility window for a toast that has just become visible.
 * Phase 14-01: rapid-succession messages (within MIN_VISIBLE_MS=1500ms)
 * are queued FIFO so unread messages are not clobbered. Slow-arrival
 * messages still replace immediately (no behavior change for the
 * save/load/share success path).
 */
export const MIN_VISIBLE_MS = 1500;

/**
 * DoS cap on the queue. Realistic chained-action bursts top out at 3
 * (e.g. save → success → version-warn). 8 leaves comfortable headroom
 * while preventing memory growth from a runaway caller. Enforced in
 * pushToast: when queue.length >= 8 we drop the oldest queued entry
 * before appending the new one. (T-14-01-03 mitigation.)
 */
const QUEUE_MAX = 8;

let nextId = 1;
const listeners = new Set<(msg: ToastMessage | null) => void>();
let current: ToastMessage | null = null;
const queue: ToastMessage[] = [];
let visibleSince = 0;
let drainTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleDrain(): void {
  if (queue.length === 0 || drainTimer !== null) return;
  const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - visibleSince));
  drainTimer = setTimeout(() => {
    drainTimer = null;
    // Auto-advance only if a message is still visible (the one we
    // scheduled against). Calling dismissToast() drains the queue head.
    if (current !== null) dismissToast();
  }, wait);
}

export function pushToast(body: string, tone: ToastMessage['tone'] = 'info'): void {
  const next: ToastMessage = { id: nextId++, body, tone };
  const now = Date.now();
  const elapsed = current === null ? Infinity : now - visibleSince;
  if (current === null || elapsed >= MIN_VISIBLE_MS) {
    current = next;
    visibleSince = now;
    listeners.forEach((fn) => fn(current));
    return;
  }
  // T-14-01-03 DoS cap: drop oldest queued entry before appending.
  if (queue.length >= QUEUE_MAX) {
    queue.shift();
  }
  queue.push(next);
  scheduleDrain();
}

export function dismissToast(): void {
  if (drainTimer !== null) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
  const head = queue.shift();
  if (head !== undefined) {
    current = head;
    visibleSince = Date.now();
    listeners.forEach((fn) => fn(current));
    scheduleDrain();
    return;
  }
  current = null;
  listeners.forEach((fn) => fn(null));
}

/** @internal - test reset hook. Do not call from production code. */
export function __resetToastForTests(): void {
  if (drainTimer !== null) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
  queue.length = 0;
  current = null;
  visibleSince = 0;
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
 * Fixed-position dismissible toast. Auto-dismisses after 5 seconds,
 * which also drains the queue head if any (Phase 14-01).
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
