import { 
  Plus, 
  Trash2, 
  FilePlus, 
  FolderPlus, 
  RefreshCcw 
} from "lucide-react";

interface FileExplorerHeaderProps {
  isRefetching: boolean;
  onRefresh: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
}

export function FileExplorerHeader({
  isRefetching,
  onRefresh,
  onCreateFile,
  onCreateFolder,
}: FileExplorerHeaderProps) {
  return (
    <div className="h-10 flex items-center px-4 shrink-0 border-b border-border bg-panel">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
        Explorer
      </span>
      <div className="flex gap-2 ml-auto">
        <RefreshCcw
          size={14}
          className={`cursor-pointer text-muted hover:text-text ${
            isRefetching ? "animate-spin" : ""
          }`}
          onClick={onRefresh}
        />
        <FilePlus
          size={14}
          className="cursor-pointer text-muted hover:text-text"
          onClick={onCreateFile}
        />
        <FolderPlus
          size={14}
          className="cursor-pointer text-muted hover:text-text"
          onClick={onCreateFolder}
        />
      </div>
    </div>
  );
}
