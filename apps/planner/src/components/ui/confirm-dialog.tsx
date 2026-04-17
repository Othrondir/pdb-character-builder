import { useEffect, useRef } from 'react';
import { NwnButton } from './nwn-button';

interface ConfirmDialogProps {
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}

export function ConfirmDialog({
  body,
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
      <div className="confirm-dialog__actions">
        <NwnButton onClick={onCancel} variant="secondary">Cancelar</NwnButton>
        <NwnButton onClick={onConfirm} variant="primary">Aceptar</NwnButton>
      </div>
    </dialog>
  );
}
