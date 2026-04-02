import { useQuery } from "@tanstack/react-query";
import { ProjectsService } from "@/services/projects.service";

export function useProject(projectId: string) {
  const query = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => ProjectsService.get(projectId),
    enabled: !!projectId,
  });

  return {
    ...query,
    project: query.data,
  };
}
