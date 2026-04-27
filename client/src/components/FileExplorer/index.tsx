import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FSService } from "@/services/fs.service";
import { useAppStore } from "@/store";
import { buildFileTree, TreeNode } from "@/lib/tree";
import { Dialog, Trash2, FilePlus, FolderPlus, Pencil } from "../ui/Dialog";
import { ContextMenu, useContextMenu } from "../ui/ContextMenu";
import { toast } from "sonner";
import { FileExplorerHeader } from "./FileExplorerHeader";
import { FileTreeNode } from "./FileTreeNode";


type DialogState = {
  type: "create_file" | "create_folder" | "delete" | "rename" | null;
  path?: string;
  name?: string;
};

export function FileExplorer({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { activeFilePath, toggleFolder, openedFolders, openFile, renameOpenFile, removeOpenFiles } = useAppStore();
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const [inputValue, setInputValue] = useState("");
  const { contextMenu, showContextMenu, closeContextMenu } = useContextMenu();
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  const { data: nodes = [], isLoading, isRefetching } = useQuery({
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
    onSuccess: (_, deletedPath) => {
      queryClient.invalidateQueries({ queryKey: ["fs", projectId] });
      // Remove deleted file from open tabs
      removeOpenFiles([deletedPath]);
      setDialog({ type: null });
    },
  });

  const renameMutation = useMutation({
    mutationFn: (args: { oldPath: string; newPath: string }) =>
      FSService.rename(projectId, args.oldPath, args.newPath),
    onSuccess: (_, { oldPath, newPath }) => {
      queryClient.invalidateQueries({ queryKey: ["fs", projectId] });
      // Invalidate old file content cache and update open tabs
      queryClient.removeQueries({ queryKey: ["file-content", projectId, oldPath] });
      renameOpenFile(oldPath, newPath);
      setDialog({ type: null });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to move file");
    },
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
    },
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
      const fullPath = dialog.path
        ? `${dialog.path}/${inputValue}`
        : inputValue;
      createMutation.mutate({
        path: fullPath,
        isFolder: dialog.type === "create_folder",
      });
    } else if (dialog.type === "delete" && dialog.path) {
      deleteMutation.mutate(dialog.path);
    } else if (dialog.type === "rename" && dialog.path) {
      if (!inputValue) return;
      const parent = dialog.path.includes("/")
        ? dialog.path.split("/").slice(0, -1).join("/")
        : "";
      const newPath = parent ? `${parent}/${inputValue}` : inputValue;
      renameMutation.mutate({ oldPath: dialog.path, newPath });
    }
  };

  const handleDragStart = (e: React.DragEvent, path: string) => {
    e.dataTransfer.setData("sourcePath", path);
  };

  const handleDragOver = (e: React.DragEvent, path: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(path || "root");
  };

  const handleDrop = (e: React.DragEvent, targetPath: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);
    const sourcePath = e.dataTransfer.getData("sourcePath");
    const externalFiles = e.dataTransfer.files;

    if (sourcePath) {
      if (sourcePath === targetPath) return;
      const fileName = sourcePath.split("/").pop();
      if (!fileName) return;
      const newPath = targetPath ? `${targetPath}/${fileName}` : fileName;
      if (sourcePath === newPath) return;
      renameMutation.mutate({ oldPath: sourcePath, newPath });
    } else if (externalFiles && externalFiles.length > 0) {
      Array.from(externalFiles).forEach((file) => {
        const path = targetPath ? `${targetPath}/${file.name}` : file.name;
        uploadMutation.mutate({ path, file });
      });
    }
  };

  const renderTree = (items: TreeNode[], depth = 0) => {
    return items.map((node) => {
      return (
        <div key={node.id}>
          <FileTreeNode
            node={node}
            depth={depth}
            isActive={activeFilePath === node.path}
            isOpen={!!openedFolders[node.path]}
            isDragOver={dragOverPath === node.path}
            onToggle={toggleFolder}
            onOpen={openFile}
            onAction={handleAction}
            onContextMenu={showContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
          {node.type === "folder" && openedFolders[node.path] && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-panel overflow-hidden">
      <FileExplorerHeader
        isRefetching={isRefetching}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["fs", projectId] })}
        onCreateFile={() => handleAction("create_file")}
        onCreateFolder={() => handleAction("create_folder")}
      />

      <div
        className={`flex-1 overflow-auto py-1 transition-all duration-200 ${
          dragOverPath === "root" ? "bg-primary/10 ring-2 ring-inset ring-primary/50" : ""
        }`}
        onDragOver={(e) => handleDragOver(e, null)}
        onDrop={(e) => handleDrop(e, null)}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverPath(null);
        }}
      >
        {isLoading ? (
          <div className="px-4 py-2 text-xs text-muted font-mono uppercase">
            Loading...
          </div>
        ) : (
          renderTree(tree)
        )}
      </div>

      <Dialog
        isOpen={dialog.type !== null}
        onClose={() => setDialog({ type: null })}
        onConfirm={onConfirm}
        title={
          dialog.type === "create_file" ? "New File"
          : dialog.type === "create_folder" ? "New Folder"
          : dialog.type === "delete" ? "Delete Item"
          : "Rename"
        }
        targetName={
          dialog.type === "delete" || dialog.type === "rename"
            ? dialog.path?.split("/").pop()
            : undefined
        }
        description={
          dialog.type === "delete"
            ? "Are you sure you want to delete this item?"
            : dialog.type === "rename"
            ? "Enter a new name:"
            : dialog.type === "create_file"
            ? "Enter a name for the new file:"
            : "Enter a name for the new folder:"
        }
        icon={
          dialog.type === "delete" ? <Trash2 size={15} />
          : dialog.type === "create_file" ? <FilePlus size={15} />
          : dialog.type === "create_folder" ? <FolderPlus size={15} />
          : <Pencil size={15} />
        }
        confirmText={
          dialog.type === "delete" ? "Delete"
          : dialog.type === "create_file" ? "Create"
          : dialog.type === "create_folder" ? "Create"
          : "Rename"
        }
        showInput={dialog.type !== "delete"}
        inputValue={inputValue}
        onInputChange={setInputValue}
        inputPlaceholder={
          dialog.type === "create_folder" ? "folder-name"
          : dialog.type === "rename" ? dialog.path?.split("/").pop() ?? "new-name"
          : "file.py"
        }
        confirmVariant={dialog.type === "delete" ? "danger" : "primary"}
      />



      {contextMenu && <ContextMenu {...contextMenu} onClose={closeContextMenu} />}
    </div>
  );
}
