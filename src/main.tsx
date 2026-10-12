import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Observatory } from "@/components/Observatory";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Observatory />
  </StrictMode>,
);
