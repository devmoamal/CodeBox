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
      className="fixed z-200 min-w-[180px] bg-dark-panel border border-dark-border rounded-lg shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
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
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            item.variant === "danger"
              ? "text-red-400 hover:bg-red-400/10"
              : "text-gray-300 hover:bg-dark-active hover:text-white"
          } ${item.disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          <span className="flex-1 text-left">{item.label}</span>
        </button>
      ))}
    </div>,
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
