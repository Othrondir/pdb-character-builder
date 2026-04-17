import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { VersionMismatchDialog } from '@planner/components/ui/version-mismatch-dialog';
import { shellCopyEs } from '@planner/lib/copy/es';
import { formatDatasetLabel } from '@planner/data/ruleset-version';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useResumenViewModel } from './resumen-selectors';
import { ResumenTable } from './resumen-table';
import { SaveSlotDialog, LoadSlotDialog } from './save-slot-dialog';
import {
  buildShareUrl,
  diffRuleset,
  downloadBuildAsJson,
  encodeSharePayload,
  exceedsBudget,
  hydrateBuildDocument,
  importBuildFromFile,
  IncompleteBuildError,
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
  // Subscribe (not getState) so the action bar re-evaluates projectability when the
  // user picks a race / alignment without navigating away from Resumen.
  const raceId = useCharacterFoundationStore((s) => s.raceId);
  const alignmentId = useCharacterFoundationStore((s) => s.alignmentId);
  const isProjectable = raceId !== null && alignmentId !== null;
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
    try {
      const doc = projectBuildDocument(suggestedName);
      downloadBuildAsJson(doc, suggestedName);
    } catch (err) {
      if (err instanceof IncompleteBuildError) {
        pushToast(shellCopyEs.persistence.incompleteBuild, 'warn');
        return;
      }
      throw err;
    }
  }

  async function onShare() {
    const suggestedName =
      model.identity.name === copy.emptyNamePlaceholder
        ? 'build'
        : model.identity.name;
    let doc: BuildDocument;
    try {
      doc = projectBuildDocument(suggestedName);
    } catch (err) {
      if (err instanceof IncompleteBuildError) {
        pushToast(shellCopyEs.persistence.incompleteBuild, 'warn');
        return;
      }
      throw err;
    }
    const encoded = encodeSharePayload(doc);

    if (exceedsBudget(encoded)) {
      // D-06: fallback to JSON download with explanatory toast.
      downloadBuildAsJson(doc, suggestedName);
      pushToast(shellCopyEs.persistence.shareFallback, 'warn');
      return;
    }

    const url = buildShareUrl(encoded);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        pushToast(`URL copiada: ${url.length} chars`, 'info');
        return;
      } catch {
        // Fall through to visible-URL toast when clipboard is blocked.
      }
    }
    pushToast(`Copia esta URL: ${url}`, 'info');
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
        <NwnButton
          disabled={!isProjectable}
          onClick={() => setSaveOpen(true)}
          title={isProjectable ? undefined : shellCopyEs.persistence.incompleteBuild}
          variant="primary"
        >
          {copy.actions.save}
        </NwnButton>
        <NwnButton onClick={() => setLoadOpen(true)} variant="secondary">
          {copy.actions.load}
        </NwnButton>
        <NwnButton
          disabled={!isProjectable}
          onClick={onExport}
          title={isProjectable ? undefined : shellCopyEs.persistence.incompleteBuild}
          variant="secondary"
        >
          {copy.actions.export}
        </NwnButton>
        <NwnButton
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
        >
          {copy.actions.import}
        </NwnButton>
        <NwnButton
          disabled={!isProjectable}
          onClick={onShare}
          title={isProjectable ? undefined : shellCopyEs.persistence.incompleteBuild}
          variant="secondary"
        >
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
