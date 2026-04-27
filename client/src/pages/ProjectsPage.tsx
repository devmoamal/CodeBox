import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, ArrowRight, ArrowLeft, Trash2, LogOut } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "sonner";
import { SystemStats } from "@/components/SystemStats";
import { useAuthStore } from "@/store/authStore";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const limit = 10;
  const navigate = useNavigate();

  const logout = useAuthStore((state) => state.logout);
  const { data, isLoading, createProject, deleteProject } = useProjects({
    page,
    limit,
  });

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;

    try {
      const p = await createProject(newProjectName.trim());
      setIsDialogOpen(false);
      setNewProjectName("");
      navigate({ to: "/project/$projectId", params: { projectId: p.id } });
    } catch (error) {
      // Error handled by hook or UI
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
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-lg font-bold tracking-tight text-text">
            CodeBox
          </h1>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="flex items-center gap-1.5 text-muted hover:text-red-500 text-xs font-medium transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        <SystemStats />

        {/* Projects section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text">Projects</h2>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 text-xs font-medium transition-colors"
          >
            <Plus size={14} /> New Project
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted border border-border border-dashed bg-panel/50">
            <span className="text-xs font-mono">Loading…</span>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.data.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border bg-panel/30">
                <p className="text-sm text-muted mb-3">No projects yet</p>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="text-primary hover:text-primary-hover text-xs font-medium underline underline-offset-2"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              data?.data.map((project) => (
                <div
                  key={project.id}
                  className="bg-panel border border-border px-4 py-3 flex items-center justify-between hover:border-primary/40 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-muted mt-0.5 font-mono">
                      {project.id.substring(0, 8)} ·{" "}
                      {new Date(project.created_at).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setProjectToDelete({
                          id: project.id,
                          name: project.name,
                        });
                        setIsDeleteDialogOpen(true);
                      }}
                      className="p-1.5 text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>

                    <Link
                      to="/project/$projectId"
                      params={{ projectId: project.id }}
                      className="flex items-center gap-1.5 bg-bg border border-border hover:border-primary hover:text-primary px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      Open <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))
            )}

            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-border">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-border hover:bg-panel disabled:opacity-30 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>

                <span className="text-xs text-muted font-mono">
                  {data.meta.page} / {data.meta.totalPages}
                </span>

                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.meta.totalPages, p + 1))
                  }
                  disabled={page === data.meta.totalPages}
                  className="p-1.5 border border-border hover:bg-panel disabled:opacity-30 transition-colors"
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
          Are you sure you want to delete{" "}
          <span className="font-semibold text-text">
            "{projectToDelete?.name}"
          </span>
          ? This will permanently delete all files and data associated with this
          project.
        </p>
      </Dialog>
    </div>
  );
}
