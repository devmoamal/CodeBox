import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { Loader2, Terminal as TerminalIcon, Command } from "lucide-react";
import { useAppStore } from "@/store";
import { FSService } from "@/services/fs.service";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContextMenu, useContextMenu } from "../ui/ContextMenu";
import { EditorTabs } from "./Tabs";

export function CodeEditor({ projectId }: { projectId: string }) {
  const { activeFilePath, openFiles, setIsSaving } = useAppStore();
  const [content, setContent] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState("");
  const { contextMenu, closeContextMenu } = useContextMenu();

  // Fetch file content
  const { data: fileData, isLoading } = useQuery({
    queryKey: ["file-content", projectId, activeFilePath],
    queryFn: () =>
      activeFilePath
        ? FSService.readContent(projectId, activeFilePath)
        : Promise.resolve(""),
    enabled: !!activeFilePath,
    staleTime: Infinity, // Keep content in cache until manually invalidated
  });

  // Sync content state with fetched data
  useEffect(() => {
    if (fileData !== undefined) {
      setContent(fileData);
      setLastSavedContent(fileData);
    }
  }, [fileData, activeFilePath]);

  const saveMutation = useMutation({
    mutationFn: (newContent: string) =>
      FSService.updateContent(projectId, activeFilePath!, newContent),
    onSuccess: (_, newContent) => {
      setIsSaving(false);
      setLastSavedContent(newContent);
    },
  });


  // Simple auto-save implementation
  useEffect(() => {
    if (!activeFilePath || content === lastSavedContent) {
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(() => {
      saveMutation.mutate(content);
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, activeFilePath, lastSavedContent, setIsSaving]);

  if (openFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-dark-bg space-y-6">
        <div className="p-8 rounded-full bg-dark-panel border border-dark-border shadow-2xl">
          <TerminalIcon
            size={64}
            className="opacity-20 text-primary-blue animate-pulse"
          />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-gray-300">
            Welcome to CodeBox
          </h3>
          <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">
            Select or drag files from the explorer to start building your
            project.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-48 pt-4">
          <div className="flex items-center justify-between px-3 py-2 bg-dark-panel rounded border border-dark-border/50 text-[10px]">
            <span className="text-gray-400">Run Python</span>
            <span className="flex items-center gap-1 text-gray-500 font-mono">
              <Command size={10} />R
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-dark-panel rounded border border-dark-border/50 text-[10px]">
            <span className="text-gray-400">Search Files</span>
            <span className="flex items-center gap-1 text-gray-500 font-mono">
              <Command size={10} />P
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-panel rounded-xl border border-dark-border shadow-2xl overflow-hidden transition-all">
      {/* Tab Management */}
      <EditorTabs />

      {/* Editor Body */}
      <div className="flex-1 overflow-auto bg-dark-bg relative custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2
              size={24}
              className="animate-spin text-primary-yellow opacity-50"
            />
          </div>
        ) : (
          <CodeMirror
            value={content}
            height="100%"
            theme={vscodeDark}
            extensions={[python()]}
            onChange={(value) => setContent(value)}
            className="text-[13px] font-mono leading-relaxed h-full"
            basicSetup={{
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              lineNumbers: true,
              highlightActiveLine: true,
              bracketMatching: true,
            }}
          />
        )}
      </div>

      {contextMenu && (
        <ContextMenu {...contextMenu} onClose={closeContextMenu} />
      )}
    </div>
  );
}
