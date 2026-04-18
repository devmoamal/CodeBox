import { TreeNode } from "@/lib/tree";
import { getFileIcon } from "@/lib/icons";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Trash2,
} from "lucide-react";

type FileActionType = "create_file" | "create_folder" | "delete" | "rename";

interface FileTreeNodeProps {
  node: TreeNode;
  depth: number;
  isActive: boolean;
  isOpen: boolean;
  isDragOver: boolean;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
  onAction: (type: FileActionType, path: string) => void;
  onContextMenu: (e: React.MouseEvent, items: any[]) => void;
  onDragStart: (e: React.DragEvent, path: string) => void;
  onDragOver: (e: React.DragEvent, path: string) => void;
  onDrop: (e: React.DragEvent, path: string) => void;
}

export function FileTreeNode({
  node,
  depth,
  isActive,
  isOpen,
  isDragOver,
  onToggle,
  onOpen,
  onAction,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
}: FileTreeNodeProps) {
  const isFolder = node.type === "folder";

  const contextItems = [
    ...(isFolder
      ? [
          {
            label: "New File",
            icon: <FilePlus size={12} />,
            onClick: () => onAction("create_file", node.path),
          },
          {
            label: "New Folder",
            icon: <FolderPlus size={12} />,
            onClick: () => onAction("create_folder", node.path),
          },
        ]
      : []),
    {
      label: "Rename",
      onClick: () => onAction("rename", node.path),
    },
    {
      label: "Delete",
      icon: <Trash2 size={12} />,
      variant: "danger" as const,
      onClick: () => onAction("delete", node.path),
    },
  ];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.path)}
      onDragOver={(e) => isFolder && onDragOver(e, node.path)}
      onDrop={(e) => isFolder && onDrop(e, node.path)}
      className={`flex items-center gap-1.5 px-3 py-1 text-sm cursor-pointer group border-l-2 ${
        isActive
          ? "bg-primary-subtle border-primary text-text font-medium"
          : "border-transparent text-muted hover:bg-bg hover:text-text"
      } ${isDragOver ? "bg-primary-subtle border-primary" : ""}`}
      style={{ paddingLeft: `${depth * 12 + 12}px` }}
      onClick={() => (isFolder ? onToggle(node.path) : onOpen(node.path))}
      onContextMenu={(e) => onContextMenu(e, contextItems)}
    >
      <span className="w-4 flex justify-center shrink-0">
        {isFolder ? (
          isOpen ? (
            <ChevronDown size={12} className="opacity-70" />
          ) : (
            <ChevronRight size={12} className="opacity-70" />
          )
        ) : null}
      </span>
      <span className="shrink-0">
        {isFolder ? <Folder size={14} className="text-primary" /> : getFileIcon(node.path)}
      </span>
      <span className="truncate">{node.name}</span>

      <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 px-1">
        {isFolder && (
          <>
            <span title="New File">
              <FilePlus
                size={12}
                className="hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("create_file", node.path);
                }}
              />
            </span>
            <span title="New Folder">
              <FolderPlus
                size={12}
                className="hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("create_folder", node.path);
                }}
              />
            </span>
          </>
        )}
        <span title="Delete">
          <Trash2
            size={12}
            className="hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onAction("delete", node.path);
            }}
          />
        </span>
      </div>
    </div>
  );
}
