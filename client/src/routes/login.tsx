import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/pages/LoginPage";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { token } = useAuthStore.getState();
    if (token) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});
