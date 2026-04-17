import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { VersionMismatchDialog } from '@planner/components/ui/version-mismatch-dialog';
import { shellCopyEs } from '@planner/lib/copy/es';
import { formatDatasetLabel } from '@planner/data/ruleset-version';
import { useResumenViewModel } from './resumen-selectors';
import { ResumenTable } from './resumen-table';
import { SaveSlotDialog, LoadSlotDialog } from './save-slot-dialog';
import {
  diffRuleset,
  downloadBuildAsJson,
  hydrateBuildDocument,
  importBuildFromFile,
  JsonImportError,
  projectBuildDocument,
  type BuildDocument,
  type RulesetDiff,
} from '@planner/features/persistence';
import { pushToast } from '@planner/components/ui/toast';

/**
 * Top-level Resumen screen (Phase 08 D-02 / D-03).
 * Renders: dataset-label header + action bar (Guardar / Cargar / Exportar / Importar /
 * Compartir [disabled]) + ResumenTable + Save/Load dialogs + hidden file input.
 *
 * Compartir is wired in Plan 08-02.
 */
export function ResumenBoard() {
  const model = useResumenViewModel();
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<
    { doc: BuildDocument; diff: RulesetDiff } | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copy = shellCopyEs.resumen;

  function onExport() {
    const suggestedName =
      model.identity.name === copy.emptyNamePlaceholder
        ? 'build'
        : model.identity.name;
    const doc = projectBuildDocument(suggestedName);
    downloadBuildAsJson(doc, suggestedName);
  }

  async function onImportFile(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const doc = await importBuildFromFile(file);
      const diff = diffRuleset(doc);
      if (diff) {
        // D-07 + SHAR-05: do NOT hydrate when ruleset/dataset mismatches.
        // Stash the decoded doc + diff and render VersionMismatchDialog.
        // User must Cancelar (abandon) or Descargar JSON (re-emit) — no third option.
        setPendingImport({ doc, diff });
        return;
      }
      hydrateBuildDocument(doc);
      pushToast(shellCopyEs.persistence.importSuccess, 'info');
    } catch (err) {
      const reason =
        err instanceof JsonImportError ? err.message : 'desconocido';
      pushToast(
        shellCopyEs.persistence.importError.replace('{reason}', reason),
        'error',
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <section className="resumen-board" aria-label={copy.heading}>
      <header className="resumen-board__header">
        <h2>{copy.heading}</h2>
        <span
          className="resumen-board__dataset"
          aria-label={copy.datasetHeadingAria}
        >
          {formatDatasetLabel()}
        </span>
      </header>

      <NwnFrame className="resumen-board__actions">
        <NwnButton onClick={() => setSaveOpen(true)} variant="primary">
          {copy.actions.save}
        </NwnButton>
        <NwnButton onClick={() => setLoadOpen(true)} variant="secondary">
          {copy.actions.load}
        </NwnButton>
        <NwnButton onClick={onExport} variant="secondary">
          {copy.actions.export}
        </NwnButton>
        <NwnButton
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
        >
          {copy.actions.import}
        </NwnButton>
        {/* Compartir is wired in Plan 08-02 Task 3. Render disabled here so layout is final. */}
        <NwnButton variant="auxiliary" disabled aria-disabled="true">
          {copy.actions.share}
        </NwnButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={onImportFile}
          aria-label={copy.actions.import}
        />
      </NwnFrame>

      <ResumenTable model={model} />

      <SaveSlotDialog open={saveOpen} onClose={() => setSaveOpen(false)} />
      <LoadSlotDialog open={loadOpen} onClose={() => setLoadOpen(false)} />
      {pendingImport && (
        <VersionMismatchDialog
          open
          diff={pendingImport.diff}
          onCancel={() => setPendingImport(null)}
          onDownloadJson={() => {
            // Re-emit the pending doc as a JSON file so the user preserves the incoming payload.
            // Deliberately NOT calling hydrateBuildDocument — stores keep their pre-import state.
            downloadBuildAsJson(
              pendingImport.doc,
              pendingImport.doc.build.name ?? 'build-incompatible',
            );
            setPendingImport(null);
          }}
        />
      )}
    </section>
  );
}
