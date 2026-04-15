import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type NwnFrameTag = 'aside' | 'div' | 'nav' | 'section';

type NwnFrameProps<T extends NwnFrameTag = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function NwnFrame<T extends NwnFrameTag = 'div'>({
  as,
  children,
  className,
  ...rest
}: NwnFrameProps<T>) {
  const Tag = (as ?? 'div') as ElementType;

  return (
    <Tag className={`nwn-frame${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  );
}
