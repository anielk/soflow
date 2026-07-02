'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Text input
// ---------------------------------------------------------------------------
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:        string;
  error?:        string;
  hint?:         string;
  leadingIcon?:  LucideIcon;
  trailingSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leadingIcon: LeadingIcon, trailingSlot, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {LeadingIcon && (
            <LeadingIcon
              size={14}
              className="absolute left-3 text-text-muted pointer-events-none shrink-0"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full h-8 rounded-lg bg-bg-subtle border text-text-primary placeholder:text-text-muted text-sm',
              'transition-colors duration-150',
              'focus:outline-none focus:border-violet-600',
              error ? 'border-danger' : 'border-bg-border',
              LeadingIcon ? 'pl-9 pr-3' : 'px-3',
              trailingSlot ? 'pr-9' : '',
              className,
            ].join(' ')}
            {...props}
          />
          {trailingSlot && (
            <div className="absolute right-3 flex items-center">{trailingSlot}</div>
          )}
        </div>
        {error && <p className="text-xs text-danger-text">{error}</p>}
        {!error && hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?:  string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'w-full rounded-lg bg-bg-subtle border text-text-primary placeholder:text-text-muted text-sm p-3',
            'transition-colors duration-150 resize-none',
            'focus:outline-none focus:border-violet-600',
            error ? 'border-danger' : 'border-bg-border',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-danger-text">{error}</p>}
        {!error && hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
