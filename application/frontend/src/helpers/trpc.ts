import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../backend/src/app-router";
export const trpc = createTRPCReact<AppRouter>();
