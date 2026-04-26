import type { ReactNode, RefObject } from 'react';
import { NwnFrame } from './nwn-frame';

interface SelectionScreenProps {
  actionBar?: ReactNode;
  children: ReactNode;
  className?: string;
  // Phase 15-02 D-04 — optional ref to the .selection-screen__content scroller.
  // Owners that need to scope DOM queries / mutate scrollTop attach this ref;
  // omitted = identical behaviour to the original (backward compatible).
  contentRef?: RefObject<HTMLDivElement | null>;
  title: string;
}

export function SelectionScreen({
  actionBar,
  children,
  className,
  contentRef,
  title,
}: SelectionScreenProps) {
  return (
    <NwnFrame as="section" className={`selection-screen${className ? ` ${className}` : ''}`}>
      <div className="selection-screen__title-bar">
        <h2>{title}</h2>
      </div>
      <div className="selection-screen__content" ref={contentRef}>
        {children}
      </div>
      {actionBar && (
        <div className="selection-screen__action-bar">
          {actionBar}
        </div>
      )}
    </NwnFrame>
  );
}
