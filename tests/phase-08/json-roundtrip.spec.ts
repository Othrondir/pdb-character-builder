// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { buildDocumentSchema } from '@planner/features/persistence/build-document-schema';
import { downloadBuildAsJson, sanitize } from '@planner/features/persistence/json-export';
import { sampleBuildDocument } from './setup';

describe('JSON round-trip', () => {
  it('JSON.stringify -> JSON.parse -> buildDocumentSchema.parse preserves the document', () => {
    const original = sampleBuildDocument();
    const json = JSON.stringify(original);
    const parsed = buildDocumentSchema.parse(JSON.parse(json));
    expect(parsed).toEqual(original);
  });

  it('sanitize() strips unsafe characters and caps length', () => {
    expect(sanitize('  mi paladín ' + 'x'.repeat(200))).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(sanitize('  mi paladín ' + 'x'.repeat(200)).length).toBeLessThanOrEqual(60);
    expect(sanitize('')).toBe('build');
    expect(sanitize('../../etc/passwd')).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  describe('downloadBuildAsJson filename pattern', () => {
    let anchorClickSpy: ReturnType<typeof vi.fn>;
    let originalCreateElement: typeof document.createElement;

    function setupAnchorSpy() {
      anchorClickSpy = vi.fn();
      originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag.toLowerCase() === 'a') {
          // Intercept the click so tests don't actually navigate.
          (el as HTMLAnchorElement).click = anchorClickSpy as unknown as () => void;
        }
        return el;
      });
      // Stub blob URL APIs so jsdom doesn't complain.
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
      vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('constructs a pdb-build-{name}-{YYYY-MM-DD}.json filename', () => {
      setupAnchorSpy();
      const spyAppend = vi.spyOn(document.body, 'appendChild');
      downloadBuildAsJson(sampleBuildDocument(), 'mi paladin');

      expect(anchorClickSpy).toHaveBeenCalled();
      const appended = spyAppend.mock.calls.find((c) => (c[0] as HTMLElement).tagName === 'A');
      expect(appended).toBeDefined();
      const anchor = appended![0] as HTMLAnchorElement;
      expect(anchor.download).toMatch(/^pdb-build-mi_paladin-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('falls back to "build" when the suggested name is empty', () => {
      setupAnchorSpy();
      const spyAppend = vi.spyOn(document.body, 'appendChild');
      downloadBuildAsJson(sampleBuildDocument(), '');

      const appended = spyAppend.mock.calls.find((c) => (c[0] as HTMLElement).tagName === 'A');
      const anchor = appended![0] as HTMLAnchorElement;
      expect(anchor.download).toMatch(/^pdb-build-build-\d{4}-\d{2}-\d{2}\.json$/);
    });
  });
});
