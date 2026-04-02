import { FileSystemNode } from "@codebox/shared";

export interface TreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  id: string;
  children?: TreeNode[];
}

/**
 * Converts a flat list of FileSystemNode records into a nested TreeNode structure.
 */
export function buildFileTree(nodes: FileSystemNode[]): TreeNode[] {
  const nodeMap: Record<string, TreeNode> = {};
  const tree: TreeNode[] = [];

  // Sort by path depth to ensure parents are processed or available
  const sortedNodes = [...nodes].sort((a, b) => a.path.split("/").length - b.path.split("/").length);

  for (const node of sortedNodes) {
    const newNode: TreeNode = {
      id: node.id,
      name: node.name || node.path.split("/").pop() || "",
      type: node.is_folder ? "folder" : "file",
      path: node.path,
      children: node.is_folder ? [] : undefined,
    };

    nodeMap[node.path] = newNode;

    const pathParts = node.path.split("/");
    if (pathParts.length <= 1) {
      // Root level node
      tree.push(newNode);
    } else {
      const parentPath = pathParts.slice(0, -1).join("/");
      const parent = nodeMap[parentPath];
      if (parent && parent.children) {
        parent.children.push(newNode);
      } else {
        // Parent not found (shouldn't happen if sorted), add to root as fallback
        tree.push(newNode);
      }
    }
  }

  // Sort alphabetically: Folders first, then files
  const sortFunc = (a: TreeNode, b: TreeNode) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "folder" ? -1 : 1;
  };

  const recursiveSort = (list: TreeNode[]) => {
    list.sort(sortFunc);
    for (const item of list) {
      if (item.children) recursiveSort(item.children);
    }
  };

  recursiveSort(tree);
  return tree;
}
