import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FSService } from "@/services/fs.service";
import { useAppStore } from "@/store";
import { buildFileTree, TreeNode } from "@/lib/tree";
import { Folder, File, ChevronRight, ChevronDown, Plus, Trash2, Edit3, FolderPlus, FilePlus, Upload } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { ContextMenu, useContextMenu } from "../ui/ContextMenu";
import { toast } from "sonner";

type DialogState = {
  type: "create_file" | "create_folder" | "delete" | "rename" | null;
  path?: string;
  name?: string;
};

export function FileExplorer({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { activeFilePath, toggleFolder, openedFolders } = useAppStore();
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const [inputValue, setInputValue] = useState("");
  const { contextMenu, showContextMenu, closeContextMenu } = useContextMenu();
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ["fs", projectId],
    queryFn: () => FSService.list(projectId),
  });

  const tree = buildFileTree(nodes);

  const createMutation = useMutation({
    mutationFn: (args: { path: string; isFolder: boolean }) =>
      FSService.create(projectId, args.path, args.isFolder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fs", projectId] });
      setDialog({ type: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (path: string) => FSService.delete(projectId, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fs", projectId] });
      setDialog({ type: null });
    },
  });

  const renameMutation = useMutation({
    mutationFn: (args: { oldPath: string; newPath: string }) =>
      FSService.rename(projectId, args.oldPath, args.newPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fs", projectId] });
      setDialog({ type: null });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to move file");
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (args: { path: string; file: File }) =>
      FSService.upload(projectId, args.path, args.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fs", projectId] });
      toast.success("File uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Upload failed");
    }
  });

  const handleAction = (type: DialogState["type"], path?: string) => {
    setDialog({ type, path });
    setInputValue("");
    if (type === "rename" && path) {
      setInputValue(path.split("/").pop() || "");
    }
  };

  const onConfirm = () => {
    if (!dialog.type) return;

    if (dialog.type === "create_file" || dialog.type === "create_folder") {
      if (!inputValue) return;
      const fullPath = dialog.path ? `${dialog.path}/${inputValue}` : inputValue;
      createMutation.mutate({ path: fullPath, isFolder: dialog.type === "create_folder" });
    } else if (dialog.type === "delete" && dialog.path) {
      deleteMutation.mutate(dialog.path);
    } else if (dialog.type === "rename" && dialog.path) {
      if (!inputValue) return;
      const parent = dialog.path.includes("/") ? dialog.path.split("/").slice(0, -1).join("/") : "";
      const newPath = parent ? `${parent}/${inputValue}` : inputValue;
      renameMutation.mutate({ oldPath: dialog.path, newPath });
    }
  };

  const handleDragStart = (e: React.DragEvent, path: string) => {
    e.dataTransfer.setData("sourcePath", path);
    // Add a ghost image or just styling if needed
  };

  const handleDragOver = (e: React.DragEvent, path: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(path);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPath(null);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);

    const sourcePath = e.dataTransfer.getData("sourcePath");
    const externalFiles = e.dataTransfer.files;

    // 1. Handle Internal Move
    if (sourcePath) {
      if (sourcePath === targetPath) return;
      
      const fileName = sourcePath.split("/").pop();
      if (!fileName) return;

      const newPath = targetPath ? `${targetPath}/${fileName}` : fileName;
      if (sourcePath === newPath) return;

      // Prevent moving a folder into its own descendants
      if (targetPath?.startsWith(sourcePath + "/")) {
        toast.error("Cannot move a folder into its own subfolder");
        return;
      }

      renameMutation.mutate({ oldPath: sourcePath, newPath });
    } 
    // 2. Handle External File Drop
    else if (externalFiles && externalFiles.length > 0) {
      Array.from(externalFiles).forEach(file => {
        const path = targetPath ? `${targetPath}/${file.name}` : file.name;
        uploadMutation.mutate({ path, file });
      });
    }
  };

  const renderTree = (items: TreeNode[], depth = 0) => {
    return items.map((node) => {
      const isFolder = node.type === "folder";
      const isOpen = isFolder && openedFolders[node.path];
      const isActive = !isFolder && activeFilePath === node.path;
      const isDragOver = dragOverPath === node.path;

      const contextItems = [
        ...(isFolder ? [
          { label: "New File", icon: <FilePlus size={12} />, onClick: () => handleAction("create_file", node.path) },
          { label: "New Folder", icon: <FolderPlus size={12} />, onClick: () => handleAction("create_folder", node.path) },
        ] : []),
        { label: "Rename", icon: <Edit3 size={12} />, onClick: () => handleAction("rename", node.path) },
        { label: "Delete", icon: <Trash2 size={12} />, variant: "danger" as const, onClick: () => handleAction("delete", node.path) },
      ];

      return (
        <div key={node.id} className="select-none">
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, node.path)}
            onDragOver={(e) => isFolder && handleDragOver(e, node.path)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => isFolder && handleDrop(e, node.path)}
            className={`flex items-center gap-2.5 px-3 py-1.5 text-xs cursor-pointer group transition-all rounded-md mx-1.5 my-0.5 ${
              isActive ? "bg-primary/15 text-primary font-medium" : "text-text-muted hover:bg-hover hover:text-text"
            } ${isDragOver ? "bg-primary/20 ring-1 ring-primary/30" : ""}`}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            onClick={() => {
              if (isFolder) toggleFolder(node.path);
              else useAppStore.getState().openFile(node.path);
            }}
            onContextMenu={(e) => showContextMenu(e, contextItems)}
          >
            <span className="w-4 flex justify-center shrink-0">
              {isFolder ? (
                isOpen ? <ChevronDown size={14} className="opacity-70" /> : <ChevronRight size={14} className="opacity-70" />
              ) : null}
            </span>
            <span className={isFolder ? "text-accent" : "text-primary"}>
              {isFolder ? (
                <Folder size={14} fill="currentColor" fillOpacity={0.2} strokeWidth={2.5} />
              ) : (
                <File size={14} fill="currentColor" fillOpacity={0.1} strokeWidth={2} />
              )}
            </span>
            <span className={`truncate ${isActive ? "text-primary font-semibold" : ""}`}>
              {node.name}
            </span>

            {/* Actions Menu */}
            <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-2.5 shrink-0 px-2">
              {isFolder && (
                <Plus size={12} className="text-text-muted hover:text-text" onClick={(e) => { e.stopPropagation(); handleAction("create_file", node.path); }} />
              )}
              <Trash2 size={12} className="text-text-muted hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleAction("delete", node.path); }} />
            </div>
          </div>
          {isFolder && isOpen && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
      <div className="h-10 flex items-center px-4 shrink-0 bg-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Files</span>
        </div>
        <div className="flex gap-2.5 ml-auto">
          <FilePlus size={14} className="cursor-pointer text-text-muted hover:text-text transition-colors" onClick={() => handleAction("create_file")} />
          <FolderPlus size={14} className="cursor-pointer text-text-muted hover:text-text transition-colors" onClick={() => handleAction("create_folder")} />
        </div>
      </div>
      
      <div 
        className={`flex-1 overflow-auto py-2 custom-scrollbar transition-colors ${dragOverPath === null && dragOverPath !== undefined ? "bg-primary/5" : ""}`}
        onDragOver={(e) => handleDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        {isLoading ? (
          <div className="px-5 py-3 text-xs text-text-muted animate-pulse font-mono tracking-tight">Syncing files...</div>
        ) : nodes.length === 0 ? (
          <div className="px-6 py-12 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center text-text-muted">
              <Upload size={18} />
            </div>
            <p className="text-xs text-text-muted">No files yet.</p>
            <div className="flex flex-col gap-2 w-full">
              <button 
                onClick={() => handleAction("create_file")}
                className="text-[10px] w-full bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors font-semibold"
              >
                + New File
              </button>
            </div>
          </div>
        ) : (
          renderTree(tree)
        )}
      </div>

      {/* Dialog Rendering */}
      <Dialog
        isOpen={dialog.type !== null}
        onClose={() => setDialog({ type: null })}
        onConfirm={onConfirm}
        title={
          dialog.type === "create_file" ? "New File" :
          dialog.type === "create_folder" ? "New Folder" :
          dialog.type === "delete" ? "Delete Resource" :
          dialog.type === "rename" ? "Rename Resource" : ""
        }
        description={
          dialog.type === "delete" ? `Are you sure you want to delete ${dialog.path}?` :
          undefined
        }
        showInput={dialog.type === "create_file" || dialog.type === "create_folder" || dialog.type === "rename"}
        inputValue={inputValue}
        onInputChange={setInputValue}
        confirmVariant={dialog.type === "delete" ? "danger" : "primary"}
        confirmText={
          dialog.type === "delete" ? "Delete" : 
          dialog.type === "rename" ? "Rename" :
          "Create"
        }
      />

      {contextMenu && (
        <ContextMenu {...contextMenu} onClose={closeContextMenu} />
      )}
    </div>
  );
}
