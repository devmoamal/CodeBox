import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, ArrowRight, ArrowLeft } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Dialog } from "@/components/ui/Dialog";
import { ThemeToggle } from "@/components/ThemeToggle";

export function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const limit = 10;
  const navigate = useNavigate();

  const { data, isLoading, createProject } = useProjects({ page, limit });

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const p = await createProject(newProjectName.trim());
      setIsDialogOpen(false);
      setNewProjectName("");
      navigate({ to: "/project/$projectId", params: { projectId: p.id } });
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text p-8 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12 pb-6 border-b border-border/30">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-0.5">
            <span className="text-primary">Code</span>
            <span className="text-accent">Box</span>
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg transition-all active:scale-95 text-sm font-medium"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
            <span className="text-text-muted font-medium">Booting workspace...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.data.length === 0 ? (
              <div className="text-center py-32 bg-panel/30 backdrop-blur-sm rounded-2xl border border-dashed border-border/60 hover:border-accent/50 transition-colors">
                <div className="bg-panel w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <Plus size={24} className="text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-1">No projects yet</h3>
                <p className="text-text-muted mb-6">Create your first isolated workspace to begin coding.</p>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="text-primary hover:text-primary-hover hover:underline font-medium transition-colors"
                >
                  Create a new project
                </button>
              </div>
            ) : (
              data?.data.map((project) => (
                <div
                  key={project.id}
                  className="bg-panel border border-border p-5 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all group"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to="/project/$projectId"
                    params={{ projectId: project.id }}
                    className="flex items-center gap-2 bg-hover hover:bg-active text-text px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Open <ArrowRight size={16} />
                  </Link>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-12 pt-8 border-t border-border">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-panel border border-border hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ArrowLeft size={20} />
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text">Page {data.meta.page}</span>
                  <span className="text-sm text-text-muted">of {data.meta.totalPages}</span>
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page === data.meta.totalPages}
                  className="p-2 rounded-lg bg-panel border border-border hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ArrowRight size={20} />
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
        title="Create New Project"
        description="Launch a new coding environment. Give your project a name to get started."
        showInput={true}
        inputValue={newProjectName}
        onInputChange={setNewProjectName}
        inputPlaceholder="Project name (e.g. My Website)"
        confirmText="Launch Project"
      />
    </div>
  );
}
