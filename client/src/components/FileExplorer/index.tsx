import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FSService } from "@/services/fs.service";
import { useAppStore } from "@/store";
import { buildFileTree, TreeNode } from "@/lib/tree";
import { Dialog } from "../ui/Dialog";
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
  const { activeFilePath, toggleFolder, openedFolders, openFile } = useAppStore();
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
    setDragOverPath(path);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string | null) => {
    e.preventDefault();
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
        className="flex-1 overflow-auto py-1"
        onDragOver={(e) => handleDragOver(e, null)}
        onDrop={(e) => handleDrop(e, null)}
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
          dialog.type === "create_file"
            ? "New File"
            : dialog.type === "create_folder"
            ? "New Folder"
            : dialog.type === "delete"
            ? "Delete"
            : "Rename"
        }
        showInput={dialog.type !== "delete"}
        inputValue={inputValue}
        onInputChange={setInputValue}
        confirmVariant={dialog.type === "delete" ? "danger" : "primary"}
      />

      {contextMenu && <ContextMenu {...contextMenu} onClose={closeContextMenu} />}
    </div>
  );
}
