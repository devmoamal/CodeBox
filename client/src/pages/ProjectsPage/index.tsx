import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, ArrowRight, ArrowLeft } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Dialog } from "@/components/ui/Dialog";

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
    <div className="min-h-screen bg-dark-bg text-gray-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-dark-border">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-primary-blue px-2 py-1 rounded bg-blue-900/20">Code</span>
            <span className="text-primary-yellow px-2 py-1 rounded bg-yellow-900/20">Box</span>
          </h1>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus size={18} /> New Project
          </button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-blue"></div>
            <span className="ml-3 text-gray-400">Loading projects...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.data.length === 0 ? (
              <div className="text-center py-20 bg-dark-panel rounded-xl border border-dashed border-dark-border">
                <p className="text-gray-500 mb-4">No projects found. Create one to get started.</p>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="text-primary-blue hover:underline font-medium"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              data?.data.map((project) => (
                <div
                  key={project.id}
                  className="bg-dark-panel border border-dark-border p-5 rounded-xl flex items-center justify-between hover:border-primary-blue/50 hover:bg-dark-hover/50 transition-all group shadow-sm hover:shadow-primary-blue/10"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary-blue transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to="/project/$projectId"
                    params={{ projectId: project.id }}
                    className="flex items-center gap-2 bg-dark-hover hover:bg-primary-yellow/10 text-primary-yellow hover:text-yellow-400 px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    Open <ArrowRight size={18} />
                  </Link>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-12 pt-6 border-t border-dark-border/50">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-dark-panel border border-dark-border hover:bg-dark-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ArrowLeft size={20} />
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">Page {data.meta.page}</span>
                  <span className="text-sm text-gray-500">of {data.meta.totalPages}</span>
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page === data.meta.totalPages}
                  className="p-2 rounded-lg bg-dark-panel border border-dark-border hover:bg-dark-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
