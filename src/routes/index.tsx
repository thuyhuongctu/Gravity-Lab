import { createFileRoute } from "@tanstack/react-router";
import { Observatory } from "@/components/Observatory";

export const Route = createFileRoute("/")({ component: Observatory });
