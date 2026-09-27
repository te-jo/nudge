import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateFolderInput, Folder, UpdateFolderInput } from "@nudge/shared-types";

import { apiFetch } from "@/lib/api";

export function useFolders() {
  return useQuery({
    queryKey: ["folders"],
    queryFn: () => apiFetch<Folder[]>("/folders"),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFolderInput) =>
      apiFetch<Folder>("/folders", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useUpdateFolder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFolderInput) =>
      apiFetch<Folder>(`/folders/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDeleteFolder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/folders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      // Tasks keep existing but lose their folder, so refetch those too.
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
