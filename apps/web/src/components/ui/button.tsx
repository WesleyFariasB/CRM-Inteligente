import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const buttonVariants = cva('button', {
  variants: {
    variant: {
      primary: 'button-primary',
      secondary: 'button-secondary',
      ghost: 'button-ghost',
      danger: 'button-danger',
    },
    size: { sm: 'button-sm', md: 'button-md', lg: 'button-lg' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  children: ReactNode;
}
export function Button({ className, variant, size, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}
