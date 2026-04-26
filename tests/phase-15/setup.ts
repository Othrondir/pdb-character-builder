// Phase 15-01 setup — jsdom does not implement <dialog>.showModal()'s top-layer
// focus-return contract. Worse: jsdom 29 ships HTMLDialogElement WITHOUT a
// `showModal`/`close` method on the prototype at all (`HTMLDialogElement.prototype.showModal`
// resolves to `undefined`). So we cannot wrap an "original" — we must install
// a complete reimplementation that:
//   - toggles the `open` attribute (HTML spec dialog open state),
//   - records document.activeElement at showModal() time,
//   - restores it on close() (browser top-layer focus-return contract).
//
// Honors D-NO-DEPS: pure project file, no new packages.
//
// Loaded via vitest.config.ts test.setupFiles for every phase-15 spec; running
// it for non-jsdom suites is a no-op because HTMLDialogElement is undefined
// outside jsdom.
//
// References:
//   - HTML spec, dialog showModal: https://html.spec.whatwg.org/multipage/interactive-elements.html#dom-dialog-showmodal
//   - WAI-ARIA APG dialog pattern (focus restoration on close).

if (typeof HTMLDialogElement !== 'undefined') {
  const previouslyFocused = new WeakMap<HTMLDialogElement, HTMLElement | null>();

  HTMLDialogElement.prototype.showModal = function patchedShowModal(this: HTMLDialogElement) {
    const prior = (document.activeElement as HTMLElement | null) ?? null;
    previouslyFocused.set(this, prior);
    this.setAttribute('open', '');
  };

  HTMLDialogElement.prototype.close = function patchedClose(
    this: HTMLDialogElement,
    returnValue?: string,
  ) {
    const prior = previouslyFocused.get(this) ?? null;
    previouslyFocused.delete(this);
    this.removeAttribute('open');
    if (typeof returnValue === 'string') {
      // returnValue is exposed as HTMLDialogElement.returnValue (HTML spec).
      (this as HTMLDialogElement & { returnValue: string }).returnValue = returnValue;
    }
    if (prior !== null && typeof prior.focus === 'function') {
      prior.focus();
    }
  };
}
