import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { Supplier } from "@/lib/types";

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () =>
      pb.collection("suppliers").getFullList<Supplier>({
        sort: "name",
        filter: "is_active!=false",
      }),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; phone?: string; address?: string }) =>
      pb.collection("suppliers").create({ ...data, is_active: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      phone?: string;
      address?: string;
      is_active?: boolean;
    }) => pb.collection("suppliers").update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
