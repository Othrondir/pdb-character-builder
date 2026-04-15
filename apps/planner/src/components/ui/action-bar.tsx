import type { ReactNode } from 'react';
import { NwnButton } from './nwn-button';

interface ActionBarProps {
  acceptDisabled?: boolean;
  acceptLabel?: string;
  cancelLabel?: string;
  leftContent?: ReactNode;
  onAccept?: () => void;
  onCancel?: () => void;
}

export function ActionBar({
  acceptDisabled = false,
  acceptLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  leftContent,
  onAccept,
  onCancel,
}: ActionBarProps) {
  return (
    <div className="action-bar">
      {leftContent && <div className="action-bar__left">{leftContent}</div>}
      {onCancel && (
        <NwnButton onClick={onCancel} variant="secondary">
          {cancelLabel}
        </NwnButton>
      )}
      {onAccept && (
        <NwnButton disabled={acceptDisabled} onClick={onAccept} variant="primary">
          {acceptLabel}
        </NwnButton>
      )}
    </div>
  );
}
