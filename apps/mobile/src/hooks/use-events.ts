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

export type TaskStats = { count: number; lastAt: string };

/**
 * Per-task counts and last-logged time, derived from one page of events
 * rather than a query per task.
 *
 * Caveat: only covers the most recent MAX_LIMIT (200) events, so a task with
 * nothing recent reads as "never". Swap for a server-side aggregate if that
 * starts to matter.
 */
export function useTaskStats() {
  return useQuery({
    queryKey: ["events", "task-stats"],
    queryFn: async () => {
      const rows = await apiFetch<EventWithRelations[]>("/events?limit=200");
      const stats = new Map<string, TaskStats>();
      // Rows come back newest first, so the first hit per task is its latest.
      for (const row of rows) {
        if (!row.taskId) continue;
        const existing = stats.get(row.taskId);
        if (existing) existing.count += 1;
        else stats.set(row.taskId, { count: 1, lastAt: row.createdAt });
      }
      return stats;
    },
  });
}

export function useLogEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      apiFetch<Event>("/events", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
