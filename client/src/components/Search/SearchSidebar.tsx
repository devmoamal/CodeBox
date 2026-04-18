import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store";
import {
  Search as SearchIcon,
  Loader2,
  FileText,
  CaseSensitive,
  WholeWord,
} from "lucide-react";
import { SearchResultItem } from "./SearchResultItem";

interface SearchResult {
  path: string;
  line: number;
  text: string;
  type: "content" | "file";
}

interface GroupedResult {
  path: string;
  matches: SearchResult[];
}

export function SearchSidebar({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const { openFile } = useAppStore();

  const groupResults = (data: SearchResult[]): GroupedResult[] => {
    const groups: Record<string, SearchResult[]> = {};
    data.forEach((res) => {
      if (!groups[res.path]) groups[res.path] = [];
      groups[res.path].push(res);
    });
    return Object.entries(groups).map(([path, matches]) => ({ path, matches }));
  };

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        let url = `/api/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}`;
        if (matchCase) url += "&matchCase=true";
        if (wholeWord) url += "&wholeWord=true";

        const response = await fetch(url);
        const data = await response.json();

        if (data.ok) {
          const grouped = groupResults(data.data || []);
          setResults(grouped);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, matchCase, wholeWord],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-border space-y-3">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Search
        </h2>

        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-bg border border-border pl-8 pr-16 py-1.5 text-xs focus:border-primary outline-none placeholder:text-muted"
            />
            <SearchIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            />

            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button
                onClick={() => setMatchCase(!matchCase)}
                className={`p-1 border ${matchCase ? "bg-primary border-primary text-white" : "border-transparent text-muted hover:text-text"}`}
                title="Match Case"
              >
                <CaseSensitive size={12} />
              </button>
              <button
                onClick={() => setWholeWord(!wholeWord)}
                className={`p-1 border ${wholeWord ? "bg-primary border-primary text-white" : "border-transparent text-muted hover:text-text"}`}
                title="Whole Word"
              >
                <WholeWord size={12} />
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-[10px] text-primary font-mono uppercase">
              <Loader2 size={10} className="animate-spin" />
              Searching...
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {results.length === 0 && query.length >= 2 && !isLoading && (
          <div className="text-center py-8 text-muted text-[10px] font-bold uppercase tracking-widest">
            No matches
          </div>
        )}

        {results.map((group) => (
          <div key={group.path} className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-muted uppercase tracking-tight">
              <FileText size={12} className="shrink-0" />
              <span className="truncate flex-1">
                {group.path.split("/").pop()}
              </span>
              <span className="text-[10px] border border-border px-1.5 bg-bg">
                {group.matches.length}
              </span>
            </div>

            <div className="pl-4 space-y-0.5 border-l border-border ml-2">
              {group.matches.map((match, idx) => (
                <SearchResultItem
                  key={`${match.path}-${match.line}-${idx}`}
                  match={match}
                  onClick={() => openFile(match.path)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
