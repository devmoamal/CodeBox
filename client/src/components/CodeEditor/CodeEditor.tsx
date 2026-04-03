import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { Loader2, Terminal as TerminalIcon, Command } from "lucide-react";
import { useAppStore } from "@/store";
import { FSService } from "@/services/fs.service";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContextMenu, useContextMenu } from "../ui/ContextMenu";
import { EditorTabs } from "./Tabs";

export function CodeEditor({ projectId }: { projectId: string }) {
  const { activeFilePath, openFiles, setIsSaving, theme } = useAppStore();
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
      <div className="flex flex-col items-center justify-center h-full text-text-muted bg-bg space-y-8">
        <div className="p-10 rounded-3xl bg-panel border border-border">
          <TerminalIcon
            size={48}
            className="opacity-40 text-primary"
          />
        </div>
        <div className="text-center space-y-1.5 px-6">
          <h3 className="text-lg font-bold text-text tracking-tight">
            Welcome to CodeBox
          </h3>
          <p className="text-sm text-text-muted max-w-[280px] leading-relaxed">
            Select or drag files from the explorer to start building your
            project.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-56 pt-2">
          <div className="flex items-center justify-between px-4 py-2.5 bg-panel rounded-xl border border-border text-[11px] font-medium">
            <span className="text-text-muted">Run Python</span>
            <span className="flex items-center gap-1.5 text-text-muted font-mono opacity-60">
              <Command size={11} />R
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-panel rounded-xl border border-border text-[11px] font-medium">
            <span className="text-text-muted">Search Files</span>
            <span className="flex items-center gap-1.5 text-text-muted font-mono opacity-60">
              <Command size={11} />P
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-panel overflow-hidden transition-all">
      {/* Tab Management */}
      <EditorTabs />

      {/* Editor Body */}
      <div className="flex-1 overflow-auto bg-bg relative custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2
              size={24}
              className="animate-spin text-primary opacity-40"
            />
          </div>
        ) : (
          <CodeMirror
            value={content}
            height="100%"
            theme={theme === 'light' ? vscodeLight : vscodeDark}
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
