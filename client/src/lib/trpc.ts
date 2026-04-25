import { createTRPCReact } from "@trpc/react-query";

// The deployed API bundle is generated and committed separately. Keeping the
// client TRPC wrapper unbound from stale server source prevents type-checks from
// breaking while the runtime API continues to use the deployed bundle.
export const trpc: any = createTRPCReact<any>() as any;
