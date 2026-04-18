import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/pages/ProjectsPage.tsx";

export const Route = createFileRoute("/")({
  component: ProjectsPage,
});
