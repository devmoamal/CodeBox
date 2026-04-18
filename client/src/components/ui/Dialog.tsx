import React, { useEffect, useRef } from "react";
import {
  X,
  Trash2,
  FilePlus,
  FolderPlus,
  Pencil,
  AlertTriangle,
} from "lucide-react";

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
  icon?: React.ReactNode;
  /** Highlighted filename/path to display prominently in the body */
  targetName?: string;
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
  icon,
  targetName,
}: DialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && showInput) {
      setTimeout(() => inputRef.current?.focus(), 80);
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

  const isDanger = confirmVariant === "danger";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xs bg-bg border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b border-border ${isDanger ? "border-red-600/40" : ""}`}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <span className={isDanger ? "text-red-500" : "text-primary"}>
                {icon}
              </span>
            )}
            <h3 className="text-sm font-semibold text-text">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text p-0.5 -mr-0.5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3">
          {/* Warning banner for danger actions */}
          {isDanger && (
            <div className="flex items-start gap-2.5 p-2.5 border border-red-600/30 bg-red-600/10">
              <AlertTriangle
                size={14}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-400 leading-relaxed">
                This action is <span className="font-bold">permanent</span> and
                cannot be undone.
              </p>
            </div>
          )}

          {/* Highlighted target filename */}
          {targetName && (
            <div className="px-3 py-2 bg-panel border border-border font-mono text-sm text-text truncate">
              {targetName}
            </div>
          )}

          {description && (
            <p className="text-xs text-text/70 leading-relaxed">
              {description}
            </p>
          )}

          {showInput && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full bg-panel border border-border px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          )}

          {children}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted hover:text-text border border-transparent hover:border-border transition-colors"
          >
            {cancelText}
          </button>

          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                isDanger
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

export { Trash2, FilePlus, FolderPlus, Pencil };
