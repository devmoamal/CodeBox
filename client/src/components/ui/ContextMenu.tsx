import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  // Adjust position if too close to edges
  const [position, setPosition] = useState({ left: x, top: y });

  useEffect(() => {
    if (menuRef.current) {
      const { offsetWidth, offsetHeight } = menuRef.current;
      const { innerWidth, innerHeight } = window;

      let left = x;
      let top = y;

      if (x + offsetWidth > innerWidth) left = innerWidth - offsetWidth - 8;
      if (y + offsetHeight > innerHeight) top = innerHeight - offsetHeight - 8;

      setPosition({ left, top });
    }
  }, [x, y, items]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-200 min-w-[200px] bg-panel border border-border rounded-xl py-1.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
      style={{ left: position.left, top: position.top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => (
        <button
          key={index}
          disabled={item.disabled}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium transition-colors ${
            item.variant === "danger"
              ? "text-red-500 hover:bg-red-500/10"
              : "text-text-muted hover:bg-hover hover:text-text"
          } ${item.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {item.icon && <span className="shrink-0 opacity-70 group-hover:opacity-100">{item.icon}</span>}
          <span className="flex-1 text-left">{item.label}</span>
        </button>
      ))}
    </div>
,
    document.body
  );
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const showContextMenu = useCallback((e: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  return { contextMenu, showContextMenu, closeContextMenu };
}
