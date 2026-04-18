import { FileSearch } from "lucide-react";

interface SearchResult {
  path: string;
  line: number;
  text: string;
  type: "content" | "file";
}

interface SearchResultItemProps {
  match: SearchResult;
  onClick: () => void;
}

export function SearchResultItem({ match, onClick }: SearchResultItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-1.5 hover:bg-bg border-l-2 border-transparent hover:border-primary group flex flex-col gap-1"
    >
      <div className="flex items-center gap-2">
        {match.type === "file" ? (
          <div className="flex items-center gap-2 w-full">
            <FileSearch size={10} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">
              Open File
            </span>
          </div>
        ) : (
          <>
            <span className="text-[10px] font-mono text-primary/60 group-hover:text-primary shrink-0">
              {match.line}
            </span>
            <span className="text-[10px] font-mono text-muted group-hover:text-text truncate line-clamp-1">
              {match.text.trim()}
            </span>
          </>
        )}
      </div>
    </button>
  );
}
