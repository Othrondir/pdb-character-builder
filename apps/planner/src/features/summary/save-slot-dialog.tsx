import { useEffect, useRef, useState } from 'react';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { ConfirmDialog } from '@planner/components/ui/confirm-dialog';
import { shellCopyEs } from '@planner/lib/copy/es';
import {
  listSlots,
  saveSlot,
  loadSlot,
  slotExists,
  projectBuildDocument,
  hydrateBuildDocument,
  IncompleteBuildError,
  type BuildSlotRow,
} from '@planner/features/persistence';
import { pushToast } from '@planner/components/ui/toast';

interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Guardar flow: name prompt + confirm; on slot-name collision, opens a ConfirmDialog
 * overwrite branch (reuses the Phase-7-descope ConfirmDialog primitive).
 */
export function SaveSlotDialog({ open, onClose }: SaveDialogProps) {
  const [name, setName] = useState('');
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const copy = shellCopyEs.persistence.saveDialog;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  async function handleConfirm() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (await slotExists(trimmed)) {
      setOverwriteOpen(true);
      return;
    }
    await doSave(trimmed);
  }

  async function doSave(finalName: string) {
    // Defensive guard: the action-bar button is disabled when the build is not
    // projectable, but this dialog can also be triggered while the user navigates
    // back to origin steps. If the store ever hands us nulls we catch the typed
    // error here, show a toast, and leave the dialog open with the typed name.
    let doc;
    try {
      doc = projectBuildDocument(finalName);
    } catch (err) {
      if (err instanceof IncompleteBuildError) {
        pushToast(shellCopyEs.persistence.incompleteBuild, 'warn');
        setOverwriteOpen(false);
        return;
      }
      throw err;
    }
    await saveSlot(finalName, doc);
    pushToast(
      shellCopyEs.persistence.saveSuccess.replace('{name}', finalName),
      'info',
    );
    setName('');
    setOverwriteOpen(false);
    onClose();
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className="nwn-frame save-slot-dialog"
        onCancel={onClose}
      >
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <label>
          {copy.nameLabel}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.namePlaceholder}
            maxLength={80}
            autoFocus
          />
        </label>
        <div className="save-slot-dialog__actions">
          <NwnButton variant="secondary" onClick={onClose}>
            {copy.cancel}
          </NwnButton>
          <NwnButton variant="primary" onClick={handleConfirm}>
            {copy.confirm}
          </NwnButton>
        </div>
      </dialog>
      <ConfirmDialog
        open={overwriteOpen}
        title={shellCopyEs.persistence.overwriteDialog.title}
        body={shellCopyEs.persistence.overwriteDialog.body}
        onCancel={() => setOverwriteOpen(false)}
        onConfirm={() => doSave(name.trim())}
      />
    </>
  );
}

interface LoadDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Cargar flow: lists slots newest-first; clicking one runs loadSlot + hydrateBuildDocument.
 */
export function LoadSlotDialog({ open, onClose }: LoadDialogProps) {
  const [slots, setSlots] = useState<BuildSlotRow[] | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const copy = shellCopyEs.persistence.loadDialog;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      listSlots()
        .then(setSlots)
        .catch(() => setSlots([]));
    } else if (!open && el.open) el.close();
  }, [open]);

  async function onPick(slotName: string) {
    const doc = await loadSlot(slotName);
    if (!doc) return;
    hydrateBuildDocument(doc);
    pushToast(
      shellCopyEs.persistence.loadSuccess.replace('{name}', slotName),
      'info',
    );
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="nwn-frame load-slot-dialog"
      onCancel={onClose}
    >
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      {slots === null && <p>{shellCopyEs.resumen.loadingState}</p>}
      {slots !== null && slots.length === 0 && (
        <p>{shellCopyEs.resumen.noSlotsMessage}</p>
      )}
      {slots !== null && slots.length > 0 && (
        <ul className="load-slot-dialog__list">
          {slots.map((row) => (
            <li key={row.name}>
              <button type="button" onClick={() => onPick(row.name)}>
                <strong>{row.name}</strong>
                <small> — {new Date(row.updatedAt).toLocaleString()}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="load-slot-dialog__actions">
        <NwnButton variant="secondary" onClick={onClose}>
          {copy.cancel}
        </NwnButton>
      </div>
    </dialog>
  );
}
