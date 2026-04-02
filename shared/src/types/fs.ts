export interface FileSystemNode {
  id: string;
  name: string;
  path: string; // relative path within project
  is_folder: boolean;
  project_id: string;
  created_at: string | Date;
  updated_at: string | Date;
}
