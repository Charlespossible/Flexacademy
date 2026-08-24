import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Base Input ───────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, hint, leftIcon, rightIcon, wrapperClassName, id, ...props },
    ref
  ) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className={cn('flex flex-col gap-0', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide"
          >
            {label}
            {props.required && <span className="text-brand-danger ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-base-elevated border rounded-lg px-3.5 py-2.5',
              'text-text-primary placeholder:text-text-muted text-sm',
              'focus:outline-none focus:ring-1 transition-all duration-150 font-body',
              error
                ? 'border-brand-danger/50 focus:border-brand-danger focus:ring-brand-danger/20'
                : 'border-border-subtle focus:border-accent/30 focus:ring-accent/20',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-brand-danger flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {!error && hint && (
          <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Password Input ───────────────────────────────────────────────────────────
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showStrength?: boolean;
  strength?: { score: number; label: string; color: string; width: string };
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength = false, strength, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div>
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          rightIcon={
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="cursor-pointer text-text-muted hover:text-text-secondary transition-colors p-0.5"
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...props}
        />
        {showStrength && strength && props.value && String(props.value).length > 0 && (
          <div className="mt-2">
            <div className="h-0.5 bg-base-subtle rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300', strength.color, strength.width)}
              />
            </div>
            {strength.label && (
              <p className={cn('text-xs mt-1', strength.color.replace('bg-', 'text-'))}>
                {strength.label}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

// ─── Textarea ─────────────────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, wrapperClassName, id, ...props }, ref) => {
    const inputId = id ?? `textarea-${Math.random().toString(36).slice(2)}`;

    return (
      <div className={cn('flex flex-col gap-0', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide"
          >
            {label}
            {props.required && <span className="text-brand-danger ml-0.5">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-base-elevated border rounded-lg px-3.5 py-2.5',
            'text-text-primary placeholder:text-text-muted text-sm',
            'focus:outline-none focus:ring-1 transition-all duration-150 font-body',
            'resize-none min-h-[100px]',
            error
              ? 'border-brand-danger/50 focus:border-brand-danger focus:ring-brand-danger/20'
              : 'border-border-subtle focus:border-accent/30 focus:ring-accent/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-brand-danger">⚠ {error}</p>
        )}
        {!error && hint && (
          <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Select ───────────────────────────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, wrapperClassName, id, ...props }, ref) => {
    const inputId = id ?? `select-${Math.random().toString(36).slice(2)}`;

    return (
      <div className={cn('flex flex-col gap-0', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide"
          >
            {label}
            {props.required && <span className="text-brand-danger ml-0.5">*</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-base-elevated border rounded-lg px-3.5 py-2.5',
            'text-text-primary text-sm appearance-none cursor-pointer font-body',
            'focus:outline-none focus:ring-1 transition-all duration-150',
            error
              ? 'border-brand-danger/50 focus:border-brand-danger focus:ring-brand-danger/20'
              : 'border-border-subtle focus:border-accent/30 focus:ring-accent/20',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-base-elevated text-text-muted">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-base-elevated text-text-primary"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-brand-danger">⚠ {error}</p>
        )}
        {!error && hint && (
          <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Input, PasswordInput, Textarea, Select };
