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
      queryClient.invalidateQueries({ queryKey: ["tags"] });
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
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTag(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
