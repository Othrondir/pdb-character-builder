import { useEffect, useRef } from 'react';
import { NwnButton } from './nwn-button';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { RulesetDiff } from '@planner/features/persistence';
import { useBodyScrollLock } from '@planner/lib/a11y/use-body-scroll-lock';

interface VersionMismatchDialogProps {
  open: boolean;
  diff: RulesetDiff;
  onDownloadJson: () => void;
  onCancel: () => void;
}

/**
 * D-07 + SHAR-05 fail-closed dialog. Rendered for both share-URL and JSON-import paths
 * when the incoming BuildDocument's rulesetVersion or datasetId does not match the
 * current planner. Offers two terminal actions:
 *   - Descargar JSON: preserves the incoming payload as a file; does NOT hydrate.
 *   - Cancelar: abandons the load; does NOT hydrate.
 * Reuses the `<dialog>` primitive pattern from ConfirmDialog.
 */
export function VersionMismatchDialog({
  open,
  diff,
  onDownloadJson,
  onCancel,
}: VersionMismatchDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const copy = shellCopyEs.persistence.versionMismatch;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Phase 15-01 D-03 — body scroll lock; stacking counter is shared across
  // all modal surfaces so layered dialogs do not prematurely release.
  useBodyScrollLock(open);

  return (
    <dialog
      ref={dialogRef}
      className="nwn-frame version-mismatch-dialog"
      onCancel={onCancel}
    >
      <h2 className="version-mismatch-dialog__title">{copy.title}</h2>
      <p className="version-mismatch-dialog__body">{copy.body}</p>
      <dl className="version-mismatch-dialog__diff">
        {diff.mismatchFields.includes('rulesetVersion') && (
          <>
            <dt>{copy.rulesetLabel}</dt>
            <dd>
              <span className="version-mismatch-dialog__incoming">
                {diff.incomingRulesetVersion}
              </span>
              <span className="version-mismatch-dialog__arrow">→</span>
              <span className="version-mismatch-dialog__current">
                {diff.currentRulesetVersion}
              </span>
            </dd>
          </>
        )}
        {diff.mismatchFields.includes('datasetId') && (
          <>
            <dt>{copy.datasetLabel}</dt>
            <dd>
              <span className="version-mismatch-dialog__incoming">
                {diff.incomingDatasetId}
              </span>
              <span className="version-mismatch-dialog__arrow">→</span>
              <span className="version-mismatch-dialog__current">
                {diff.currentDatasetId}
              </span>
            </dd>
          </>
        )}
      </dl>
      <p className="version-mismatch-dialog__note">{copy.note}</p>
      <div className="version-mismatch-dialog__actions">
        <NwnButton variant="secondary" onClick={onCancel}>
          {copy.cancel}
        </NwnButton>
        <NwnButton variant="primary" onClick={onDownloadJson}>
          {copy.downloadJson}
        </NwnButton>
      </div>
    </dialog>
  );
}
