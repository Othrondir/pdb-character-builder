import type { ReactNode } from 'react';

interface DetailPanelProps {
  body?: string | ReactNode;
  children?: ReactNode;
  className?: string;
  title?: string;
}

export function DetailPanel({ body, children, className, title }: DetailPanelProps) {
  return (
    <div className={`detail-panel${className ? ` ${className}` : ''}`}>
      {title && <h3 className="detail-panel__title">{title}</h3>}
      {body && <div className="detail-panel__body">{body}</div>}
      {children}
    </div>
  );
}
