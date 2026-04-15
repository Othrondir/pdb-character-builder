import type { ComponentPropsWithoutRef } from 'react';

type NwnButtonVariant = 'auxiliary' | 'icon' | 'primary' | 'secondary';

interface NwnButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: NwnButtonVariant;
}

export function NwnButton({ className, variant = 'primary', ...props }: NwnButtonProps) {
  return (
    <button
      className={`nwn-button nwn-button--${variant}${className ? ` ${className}` : ''}`}
      type="button"
      {...props}
    />
  );
}
