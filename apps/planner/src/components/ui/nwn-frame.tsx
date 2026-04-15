import type { ReactNode } from 'react';

interface NwnFrameProps {
  as?: 'aside' | 'div' | 'nav' | 'section';
  children: ReactNode;
  className?: string;
}

export function NwnFrame({ as: Tag = 'div', children, className }: NwnFrameProps) {
  return (
    <Tag className={`nwn-frame${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  );
}
