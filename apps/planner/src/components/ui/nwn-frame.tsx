import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type NwnFrameTag = 'aside' | 'div' | 'nav' | 'section';

type NwnFrameProps = {
  as?: NwnFrameTag;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export function NwnFrame({ as: Tag = 'div', children, className, ...rest }: NwnFrameProps) {
  return (
    <Tag className={`nwn-frame${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  );
}
