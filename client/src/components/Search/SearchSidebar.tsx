import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store";
import { Search, Loader2, FileText, CaseSensitive, WholeWord, FileSearch } from "lucide-react";

interface SearchResult {
  path: string;
  line: number;
  text: string;
  type: 'content' | 'file';
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

  const handleSearch = useCallback(async (searchQuery: string) => {
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
  }, [projectId, matchCase, wholeWord]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const groupResults = (data: SearchResult[]): GroupedResult[] => {
    const groups: Record<string, SearchResult[]> = {};
    data.forEach((res) => {
      if (!groups[res.path]) groups[res.path] = [];
      groups[res.path].push(res);
    });
    return Object.entries(groups).map(([path, matches]) => ({ path, matches }));
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-border/20 space-y-3">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Search</h2>
        
        <div className="relative group/search">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files and content..."
            className="w-full bg-bg border border-border/30 rounded-xl px-9 py-2 text-xs focus:border-accent/50 focus:ring-1 focus:ring-accent/20 outline-none transition-all placeholder:text-text-muted/50"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/search:text-accent transition-colors" />
          
          {isLoading && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-accent" />
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMatchCase(!matchCase)}
            className={`p-1.5 rounded-md transition-colors ${matchCase ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text hover:bg-white/5'}`}
            title="Match Case"
          >
            <CaseSensitive size={16} />
          </button>
          <button
            onClick={() => setWholeWord(!wholeWord)}
            className={`p-1.5 rounded-md transition-colors ${wholeWord ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text hover:bg-white/5'}`}
            title="Whole Word"
          >
            <WholeWord size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
        {results.length === 0 && query.length >= 2 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted/50 text-[10px] font-bold uppercase tracking-widest">
            No matches found
          </div>
        )}

        {results.map((group) => (
          <div key={group.path} className="space-y-0.5">
            <div className="flex items-center gap-2 p-1.5 rounded-lg text-xs font-medium text-text-muted group cursor-default">
              <FileText size={12} className="shrink-0" />
              <span className="truncate flex-1">{group.path.split('/').pop()}</span>
              <span className="text-[10px] bg-border/20 px-1.5 py-0.5 rounded-full">{group.matches.length}</span>
            </div>
            
            <div className="pl-4 space-y-0.5 border-l border-border/10 ml-3">
              {group.matches.map((match, idx) => (
                <button
                  key={`${match.path}-${match.line}-${idx}`}
                  onClick={() => openFile(match.path)}
                  className="w-full text-left p-1.5 rounded-md hover:bg-white/5 group/line transition-colors flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    {match.type === 'file' ? (
                      <div className="flex items-center gap-2 w-full">
                        <FileSearch size={10} className="text-accent" />
                        <span className="text-[10px] font-bold text-accent uppercase tracking-tighter shrink-0">Open File</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] font-mono text-accent/60 group-hover/line:text-accent shrink-0">{match.line}</span>
                        <span className="text-[10px] font-mono text-text-muted truncate line-clamp-1">
                          {match.text}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
