import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Observatory } from "@/components/Observatory";
import "./styles.css";
import "./styles-academic.css";

// The service worker keeps the shell and whatever was used for offline use (production builds only).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline use is a bonus; the app works without it.
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Observatory />
  </StrictMode>,
);
