import { createTRPCReact } from "@trpc/react-query";
import type { appRouter } from "../../../server/routers";

type AppRouter = typeof appRouter;

export const trpc = createTRPCReact<AppRouter>();
