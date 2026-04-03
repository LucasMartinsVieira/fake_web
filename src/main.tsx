import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/app-shell";
import { AppProvider } from "@/state/app-context";
import "@/styles/globals.css";

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
