import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTagInput, Tag, UpdateTagInput } from "@nudge/shared-types";

import { apiFetch } from "@/lib/api";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => apiFetch<Tag[]>("/tags"),
  });
}

export function useTag(id: string | undefined) {
  return useQuery({
    queryKey: ["tags", id],
    queryFn: () => apiFetch<Tag>(`/tags/${id}`),
    enabled: !!id,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTagInput) =>
      apiFetch<Tag>("/tags", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

/**
 * Link or unlink an arbitrary tag. The FK lives on the tag, so "give this
 * task a tag" is really a PATCH of the tag's taskId.
 */
export function useSetTagTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, taskId }: { tagId: string; taskId: string | null }) =>
      apiFetch<Tag>(`/tags/${tagId}`, { method: "PATCH", body: JSON.stringify({ taskId }) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

/** Put a tag on a room spot, or take it off with `spot: null`. */
export function useSetTagSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, spot }: { tagId: string; spot: string | null }) =>
      apiFetch<Tag>(`/tags/${tagId}`, { method: "PATCH", body: JSON.stringify({ spot }) }),
    onSuccess: () => {
      // Placing a tag can bump another off the spot, so refetch the list.
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateTag(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTagInput) =>
      apiFetch<Tag>(`/tags/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (tag) => {
      queryClient.setQueryData(["tags", id], tag);
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

/** Takes the id per call, for use from a list. */
export function useDeleteTagById() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteTag(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
