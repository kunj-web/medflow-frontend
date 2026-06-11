"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helper,
  leftAddon,
  rightAddon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
          {props.required && (
            <span className="ml-1 text-[var(--error)]">*</span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
            {leftAddon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            "w-full h-9 rounded-[var(--radius-md)] border text-sm",
            "bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0 focus:border-[var(--accent)]",
            "disabled:bg-[var(--gray-100)] disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-[var(--error)] focus:ring-[var(--error)]"
              : "border-[var(--border)] hover:border-[var(--border-strong)]",
            leftAddon ? "pl-9" : "pl-3",
            rightAddon ? "pr-9" : "pr-3",
            className
          )}
          {...props}
        />

        {rightAddon && (
          <div className="absolute right-3 text-[var(--text-muted)]">
            {rightAddon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--error)]">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-[var(--text-muted)]">{helper}</p>
      )}
    </div>
  );
}
