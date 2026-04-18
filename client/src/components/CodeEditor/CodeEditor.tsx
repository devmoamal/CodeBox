import { useState, useEffect, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/store";
import { FSService } from "@/services/fs.service";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContextMenu, useContextMenu } from "../ui/ContextMenu";
import { EditorTabs } from "./Tabs";
import { getEditorTheme } from "@/lib/editor-themes";
import { WelcomeScreen } from "./WelcomeScreen";

export function CodeEditor({ projectId }: { projectId: string }) {
  const { activeFilePath, openFiles, setIsSaving, theme } = useAppStore();
  const [content, setContent] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState("");
  const { contextMenu, closeContextMenu } = useContextMenu();

  const editorTheme = useMemo(() => getEditorTheme(theme), [theme]);

  // Fetch file content
  const { data: fileData, isLoading } = useQuery({
    queryKey: ["file-content", projectId, activeFilePath],
    queryFn: () =>
      activeFilePath
        ? FSService.readContent(projectId, activeFilePath)
        : Promise.resolve(""),
    enabled: !!activeFilePath,
    staleTime: Infinity,
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

  const handleSave = () => {
    if (activeFilePath && content !== lastSavedContent && !saveMutation.isPending) {
      setIsSaving(true);
      saveMutation.mutate(content);
    }
  };

  // Keyboard shortcuts (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, lastSavedContent, activeFilePath, saveMutation.isPending]);

  // Simple auto-save implementation
  useEffect(() => {
    if (!activeFilePath || content === lastSavedContent) {
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(() => {
      saveMutation.mutate(content);
    }, 2000); // Increased auto-save timer slightly since we have manual save now

    return () => clearTimeout(timer);
  }, [content, activeFilePath, lastSavedContent, setIsSaving]);

  if (openFiles.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-editor-bg overflow-hidden">
      <EditorTabs />

      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-editor-bg">
            <Loader2 size={16} className="animate-spin text-primary opacity-40" />
          </div>
        ) : (
          <CodeMirror
            value={content}
            height="100%"
            theme={editorTheme}
            extensions={[python()]}
            onChange={(value) => setContent(value)}
            className="text-sm font-mono leading-none h-full"
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
