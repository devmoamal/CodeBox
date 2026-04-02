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
      <div className="relative w-full max-w-md bg-dark-panel border border-dark-border rounded-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-4 space-y-4 flex-1">
          {description && <p className="text-sm text-gray-400 leading-relaxed">{description}</p>}
          
          {showInput && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-blue transition-colors"
            />
          )}
          
          {children}
        </div>
        
        <div className="px-6 py-4 bg-dark-bg/50 border-t border-dark-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-bold rounded transition-all active:scale-95 ${
                confirmVariant === "danger" 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-primary-blue hover:bg-blue-600 text-white"
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
