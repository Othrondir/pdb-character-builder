import type { BuildDocument } from './build-document-schema';

/**
 * Emit a `pdb-build-{sanitize(name)}-{YYYY-MM-DD}.json` download.
 *
 * Side-effecting: creates an anchor, invokes click, revokes the blob URL asynchronously.
 * Does NOT return the blob URL — the function is fire-and-forget.
 *
 * Security:
 * - `sanitize()` strips to `[a-zA-Z0-9_-]` and caps at 60 chars (T-08.1-03 in threat
 *   register): prevents path traversal / shell-meta in the downloaded filename.
 * - React output anywhere else renders `name` as text, not via
 *   dangerouslySetInnerHTML (T-08.1-09).
 */
export function downloadBuildAsJson(doc: BuildDocument, suggestedName: string): void {
  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  a.href = url;
  a.download = `pdb-build-${sanitize(suggestedName)}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke asynchronously — some browsers need the URL alive briefly after click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'build';
}
