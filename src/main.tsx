import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const savedTheme = localStorage.getItem("caflow_theme");
if (savedTheme) {
  const theme = JSON.parse(savedTheme);
  if (theme === "light") {
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";
  } else if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (!prefersDark) {
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);
