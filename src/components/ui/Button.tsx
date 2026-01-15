import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, icon, className = '', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all btn-scale focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary';

    const variantClasses = {
      primary: 'bg-accent-green text-dark-primary hover:bg-accent-green/90 focus:ring-accent-green/50',
      secondary: 'bg-dark-tertiary text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary focus:ring-dark-border',
      danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 focus:ring-red-500/50',
      ghost: 'bg-transparent text-dark-text-muted hover:bg-dark-hover hover:text-dark-text-primary focus:ring-dark-border',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-[12px] gap-1.5',
      md: 'px-4 py-2.5 text-[14px] gap-2',
      lg: 'px-6 py-3 text-[16px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Icon button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', children, label, className = '', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-dark-secondary';

    const variantClasses = {
      primary: 'bg-accent-green text-dark-primary hover:bg-accent-green/90 focus:ring-accent-green/50',
      secondary: 'bg-dark-tertiary text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary focus:ring-dark-border',
      danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 focus:ring-red-500/50',
      ghost: 'text-dark-text-muted hover:bg-dark-hover hover:text-dark-text-primary focus:ring-dark-border',
    };

    const sizeClasses = {
      sm: 'w-7 h-7',
      md: 'w-9 h-9',
      lg: 'w-10 h-10',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        title={label}
        aria-label={label}
        {...props}
      >
        <span className={iconSizes[size]}>{children}</span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
