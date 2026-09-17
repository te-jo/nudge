import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateEventInput, Event, EventWithRelations } from "@nudge/shared-types";

import { apiFetch } from "@/lib/api";

const PAGE_SIZE = 30;

export function useRecentEvents(limit = 5) {
  return useQuery({
    queryKey: ["events", "recent", limit],
    queryFn: () => apiFetch<EventWithRelations[]>(`/events?limit=${limit}`),
  });
}

export function useTagEvents(tagId: string | undefined) {
  return useQuery({
    queryKey: ["events", "tag", tagId],
    queryFn: () => apiFetch<EventWithRelations[]>(`/events?tagId=${tagId}&limit=20`),
    enabled: !!tagId,
  });
}

export function useEventHistory() {
  return useInfiniteQuery({
    queryKey: ["events", "history"],
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (pageParam) params.set("before", pageParam);
      return apiFetch<EventWithRelations[]>(`/events?${params.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].createdAt : undefined,
  });
}

export function useLogEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      apiFetch<Event>("/events", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
