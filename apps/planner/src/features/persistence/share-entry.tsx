import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { VersionMismatchDialog } from '@planner/components/ui/version-mismatch-dialog';
import { pushToast } from '@planner/components/ui/toast';
import { shellCopyEs } from '@planner/lib/copy/es';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import {
  buildDocumentSchema,
  decodeSharePayload,
  diffRuleset,
  downloadBuildAsJson,
  hydrateBuildDocument,
  ShareDecodeError,
  type BuildDocument,
  type RulesetDiff,
} from '@planner/features/persistence';

type DecodeResult =
  | { status: 'pending' }
  | { status: 'ok' }
  | { status: 'mismatch'; doc: BuildDocument; diff: RulesetDiff }
  | { status: 'error'; message: string };

/**
 * Route component mounted at `/share`. Decodes a compressed BuildDocument from the `b`
 * search param, Zod-validates, checks ruleset/dataset parity, and either hydrates the
 * stores (clean match) or renders VersionMismatchDialog (D-07 fail-closed).
 *
 * State machine (see DecodeResult):
 *   pending -> ok | mismatch | error
 * Only the `ok` branch calls `hydrateBuildDocument`. Mismatch + error NEVER hydrate.
 */
export function ShareEntry() {
  const search = useSearch({ from: '/share' }) as { b: string };
  const navigate = useNavigate();
  const setActiveView = usePlannerShellStore((s) => s.setActiveView);
  const [result, setResult] = useState<DecodeResult>({ status: 'pending' });

  useEffect(() => {
    if (!search.b) {
      setResult({
        status: 'error',
        message: shellCopyEs.persistence.shareError.emptyPayload,
      });
      return;
    }

    let parsed: BuildDocument;
    try {
      const raw = decodeSharePayload(search.b);
      parsed = buildDocumentSchema.parse(raw);
    } catch (err) {
      const message =
        err instanceof ShareDecodeError
          ? err.message
          : shellCopyEs.persistence.shareError.invalidPayload;
      setResult({ status: 'error', message });
      return;
    }

    const diff = diffRuleset(parsed);
    if (diff) {
      setResult({ status: 'mismatch', doc: parsed, diff });
      return;
    }

    // Clean match: hydrate, then send user to the creation root.
    hydrateBuildDocument(parsed);
    pushToast(shellCopyEs.persistence.shareSuccess, 'info');
    setActiveView('creation');
    setResult({ status: 'ok' });
    navigate({ to: '/' });
  }, [search.b, navigate, setActiveView]);

  if (result.status === 'error') {
    return (
      <NwnFrame className="share-entry share-entry--error">
        <h2>{shellCopyEs.persistence.shareError.title}</h2>
        <p>{result.message}</p>
        <NwnButton variant="primary" onClick={() => navigate({ to: '/' })}>
          {shellCopyEs.persistence.shareError.returnHome}
        </NwnButton>
      </NwnFrame>
    );
  }

  if (result.status === 'mismatch') {
    return (
      <VersionMismatchDialog
        open
        diff={result.diff}
        onDownloadJson={() => {
          downloadBuildAsJson(result.doc, 'build-incompatible');
          navigate({ to: '/' });
        }}
        onCancel={() => navigate({ to: '/' })}
      />
    );
  }

  // `pending` and `ok` briefly render a loading line while the effect navigates away.
  return (
    <p className="share-entry share-entry--pending">
      {shellCopyEs.persistence.shareLoading}
    </p>
  );
}
