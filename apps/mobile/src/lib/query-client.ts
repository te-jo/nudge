import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve from cache rather than refetching on every mount. Mutations
      // still invalidate explicitly, so writes show up immediately; reads
      // only go back to the network on an explicit refresh.
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});
