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
  inputPlaceholder = "Enter name...",
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Dialog Panel */}
      <div className="relative w-full max-w-sm bg-panel border border-border/30 rounded-xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 shrink-0">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors p-1 hover:bg-hover rounded-md">
            <X size={14} />
          </button>
        </div>
        
        <div className="px-5 py-4 space-y-4 flex-1">
          {description && <p className="text-[12px] text-text-muted leading-relaxed font-medium">{description}</p>}
          
          {showInput && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full bg-bg border border-border/30 rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary transition-all font-medium"
            />
          )}
          
          {children}
        </div>
        
        <div className="px-5 pb-5 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-text hover:bg-hover rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                confirmVariant === "danger" 
                   ? "bg-red-500 hover:bg-red-600 text-white" 
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
