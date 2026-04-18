import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmVariant?: "primary" | "danger";
  showInput?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  inputPlaceholder?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmVariant = "primary",
  showInput = false,
  inputValue = "",
  onInputChange,
  inputPlaceholder = "Enter value...",
}: DialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && showInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showInput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && isOpen && onConfirm) onConfirm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop: Solid or high opacity, no blur as per STRICT RULES */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose} 
      />
      
      {/* Dialog Panel: No rounded, no shadows, strict borders */}
      <div className="relative w-full max-w-sm bg-bg border border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-panel shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-text p-1">
            <X size={14} />
          </button>
        </div>
        
        <div className="p-4 space-y-4 flex-1">
          {description && <p className="text-xs text-muted leading-tight font-medium">{description}</p>}
          
          {showInput && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full bg-panel border border-border px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary font-medium"
            />
          )}
          
          {children}
        </div>
        
        <div className="px-4 py-3 border-t border-border bg-panel flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-text hover:bg-bg"
          >
            {cancelText}
          </button>
          
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                confirmVariant === "danger" 
                   ? "bg-red-600 hover:bg-red-700 text-white" 
                   : "bg-primary hover:bg-primary-hover text-white"
              }`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
