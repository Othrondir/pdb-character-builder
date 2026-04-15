import type { ReactNode } from 'react';
import { NwnFrame } from './nwn-frame';

interface SelectionScreenProps {
  actionBar?: ReactNode;
  children: ReactNode;
  className?: string;
  title: string;
}

export function SelectionScreen({ actionBar, children, className, title }: SelectionScreenProps) {
  return (
    <NwnFrame as="section" className={`selection-screen${className ? ` ${className}` : ''}`}>
      <div className="selection-screen__title-bar">
        <h2>{title}</h2>
      </div>
      <div className="selection-screen__content">
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
