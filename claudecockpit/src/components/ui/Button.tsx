import { JSX, splitProps } from 'solid-js';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-neon-cyan text-void hover:bg-neon-cyan/90 shadow-lg shadow-neon-cyan/20',
  secondary: 'bg-surface border border-border text-text hover:border-neon-cyan/50 hover:text-neon-cyan',
  ghost: 'text-muted hover:text-text hover:bg-surface',
  danger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'size', 'loading', 'class', 'children', 'disabled']);

  const variant = () => local.variant || 'primary';
  const size = () => local.size || 'md';

  return (
    <button
      {...rest}
      disabled={local.disabled || local.loading}
      class={`
        inline-flex items-center justify-center gap-2
        font-medium rounded transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant()]}
        ${sizeClasses[size()]}
        ${local.class || ''}
      `}
    >
      {local.loading && (
        <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {local.children}
    </button>
  );
}
