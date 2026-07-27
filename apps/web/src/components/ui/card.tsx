import { cn } from '../../lib/cn';
import type { HTMLAttributes } from 'react';
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('card', className)} {...props} />;
}
