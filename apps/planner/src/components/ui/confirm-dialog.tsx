import { useEffect, useRef, type ReactNode } from 'react';
import { NwnButton } from './nwn-button';

interface ConfirmDialogProps {
  body: string;
  /**
   * Optional extra content rendered between the body paragraph and the
   * action row. Used by multi-step dialogs (e.g. SwapSpellDialog) that need
   * to embed an OptionList inside the confirmation shell without introducing
   * a new dialog primitive (UI-SPEC Registry Safety).
   */
  children?: ReactNode;
  /**
   * When true, the Aceptar button is disabled (native <button disabled>).
   * Used by multi-step selection dialogs that should not allow the user to
   * advance before a row is selected (WR-06 fix).
   */
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}

export function ConfirmDialog({
  body,
  children,
  confirmDisabled = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog className="nwn-frame confirm-dialog" ref={dialogRef} onCancel={onCancel}>
      <h2 className="confirm-dialog__title">{title}</h2>
      <p className="confirm-dialog__body">{body}</p>
      {children}
      <div className="confirm-dialog__actions">
        <NwnButton onClick={onCancel} variant="secondary">Cancelar</NwnButton>
        <NwnButton onClick={onConfirm} variant="primary" disabled={confirmDisabled}>Aceptar</NwnButton>
      </div>
    </dialog>
  );
}
