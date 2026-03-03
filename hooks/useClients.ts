import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { Client } from "@/lib/types";

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () =>
      pb.collection("clients").getFullList<Client>({
        sort: "name",
        filter: "is_active!=false",
      }),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => pb.collection("clients").getOne<Client>(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) =>
      pb.collection("clients").create({ ...data, is_active: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Client>) =>
      pb.collection("clients").update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}
