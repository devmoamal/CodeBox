import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectsService } from "@/services/projects.service";
import { PaginationParams } from "@codebox/shared";

export function useProjects(params: PaginationParams = { page: 1, limit: 10 }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projects", params.page, params.limit],
    queryFn: () => ProjectsService.list(params),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => ProjectsService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProjectsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    ...query,
    createProject: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteProject: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
