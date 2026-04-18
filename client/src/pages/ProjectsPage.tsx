import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "sonner";

export function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const limit = 10;
  const navigate = useNavigate();

  const { data, isLoading, createProject, deleteProject } = useProjects({ page, limit });

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const p = await createProject(newProjectName.trim());
      setIsDialogOpen(false);
      setNewProjectName("");
      navigate({ to: "/project/$projectId", params: { projectId: p.id } });
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
      toast.success("Project deleted successfully");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <h1 className="text-xl font-bold uppercase tracking-widest">
            DooBox
          </h1>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 text-sm font-bold uppercase tracking-wider"
          >
            <Plus size={16} /> New Project
          </button>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted">
            <span className="text-sm font-mono uppercase">Syncing workspace...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.data.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-border bg-panel">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2">No projects found</h3>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="text-primary hover:text-primary-hover font-bold text-xs uppercase underline"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              data?.data.map((project) => (
                <div
                  key={project.id}
                  className="bg-panel border border-border p-4 flex items-center justify-between hover:border-muted group"
                >
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-bold uppercase tracking-tight">
                      {project.name}
                    </h3>
                    <p className="text-[10px] text-muted font-mono uppercase mt-1">
                      ID: {project.id} | {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setProjectToDelete({ id: project.id, name: project.name });
                        setIsDeleteDialogOpen(true);
                      }}
                      className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <Link
                      to="/project/$projectId"
                      params={{ projectId: project.id }}
                      className="flex items-center gap-2 bg-bg border border-border hover:border-primary px-3 py-1.5 text-xs font-bold uppercase"
                    >
                      Open <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}

            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-border">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-border hover:bg-panel disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={16} />
                </button>
                
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span>{data.meta.page} / {data.meta.totalPages}</span>
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page === data.meta.totalPages}
                  className="p-1.5 border border-border hover:bg-panel disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setNewProjectName("");
        }}
        onConfirm={handleCreate}
        title="New Project"
        showInput={true}
        inputValue={newProjectName}
        onInputChange={setNewProjectName}
        inputPlaceholder="Project name..."
        confirmText="Create"
      />

      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Project"
        confirmText="Delete"
        confirmVariant="danger"
      >
        <p className="text-xs text-muted leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-text">"{projectToDelete?.name}"</span>? 
          This will permanently delete all files and data associated with this project.
        </p>
      </Dialog>
    </div>
  );
}
