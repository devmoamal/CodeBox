import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";

/**
 * Returns a real language/framework icon for a given file path.
 * Uses the react-symbols library (VS Code Symbols icon theme).
 * `autoAssign` maps special filenames (package.json, tsconfig.json, etc.) automatically.
 */
export function getFileIcon(path: string, size = 14) {
  const fileName = path.split("/").pop() || path;
  return (
    <FileIcon
      fileName={fileName}
      autoAssign
      width={size}
      height={size}
      style={{ display: "inline-block", flexShrink: 0 }}
    />
  );
}

/**
 * Returns a folder icon based on the folder name.
 * Recognises well-known folders (src, components, node_modules, etc.).
 */
export function getFolderIcon(
  folderName: string,
  isOpen = false,
  size = 14
) {
  return (
    <FolderIcon
      folderName={folderName}
      width={size}
      height={size}
      style={{ display: "inline-block", flexShrink: 0 }}
    />
  );
}
