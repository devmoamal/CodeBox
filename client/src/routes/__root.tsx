import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const isAuthPage = location.pathname === "/login";
    const { isAuthenticated, token } = useAuthStore.getState();

    if (!token && !isAuthPage) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{
          style: {
            background: "var(--panel)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "0",
            fontSize: "13px",
            fontFamily: "inherit",
          },
        }}
      />
      <Outlet />
    </QueryClientProvider>
  ),
});
