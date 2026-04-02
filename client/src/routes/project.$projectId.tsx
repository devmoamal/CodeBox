import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/pages/ProjectPage";

export const Route = createFileRoute("/project/$projectId")({
  component: ProjectPage,
});
