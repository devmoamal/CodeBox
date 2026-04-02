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
            className={`flex items-center gap-1.5 px-2 py-1 text-sm cursor-pointer group transition-all ${
              isActive ? "bg-primary-blue/20 text-blue-300 border-l-2 border-primary-blue" : "text-gray-300 hover:bg-dark-hover"
            } ${isDragOver ? "bg-primary-blue/30 scale-[1.02] shadow-lg z-10" : ""}`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (isFolder) toggleFolder(node.path);
              else useAppStore.getState().openFile(node.path);
            }}
            onContextMenu={(e) => showContextMenu(e, contextItems)}
          >
            <span className="w-4 flex justify-center shrink-0">
              {isFolder ? (
                isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : null}
            </span>
            <span className={isFolder ? "text-primary-yellow" : "text-primary-blue"}>
              {isFolder ? <Folder size={14} fill="currentColor" fillOpacity={0.2} /> : <File size={14} />}
            </span>
            <span className="truncate">{node.name}</span>

            {/* Actions Menu */}
            <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-2 shrink-0 px-2 text-gray-500">
              {isFolder && (
                <Plus size={14} className="hover:text-white" onClick={(e) => { e.stopPropagation(); handleAction("create_file", node.path); }} />
              )}
              <Trash2 size={14} className="hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleAction("delete", node.path); }} />
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
    <div className="flex flex-col h-full bg-dark-panel rounded-xl border border-dark-border shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-panel/50 backdrop-blur-sm shrink-0">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Files</span>
        <div className="flex gap-3">
          <FilePlus size={14} className="cursor-pointer text-gray-500 hover:text-white transition-colors" onClick={() => handleAction("create_file")} />
          <FolderPlus size={14} className="cursor-pointer text-gray-500 hover:text-white transition-colors" onClick={() => handleAction("create_folder")} />
        </div>
      </div>
      
      <div 
        className={`flex-1 overflow-auto py-2 custom-scrollbar transition-colors ${dragOverPath === null && dragOverPath !== undefined ? "bg-primary-blue/5" : ""}`}
        onDragOver={(e) => handleDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        {isLoading ? (
          <div className="px-4 py-2 text-xs text-gray-500 animate-pulse font-mono">Scanning storage...</div>
        ) : nodes.length === 0 ? (
          <div className="px-4 py-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-dark-hover flex items-center justify-center text-gray-600 mb-2">
              <Upload size={24} />
            </div>
            <p className="text-xs text-gray-500 italic">Project is empty</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleAction("create_file")}
                className="text-[10px] bg-primary-blue/10 text-primary-blue px-3 py-1 rounded-full hover:bg-primary-blue/20 transition-colors"
              >
                + Create first file
              </button>
              <span className="text-[9px] text-gray-600">or drop files here</span>
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
