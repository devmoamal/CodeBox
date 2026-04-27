import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { useUIStore } from "@/store/uiStore";
import { useEffect } from "react";

export function App() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    const html = document.documentElement;
    const themeClasses = Array.from(html.classList).filter((c) => c.startsWith("theme-"));
    html.classList.remove(...themeClasses);
    html.classList.add(theme);
  }, [theme]);

  return <RouterProvider router={router} />;
}
