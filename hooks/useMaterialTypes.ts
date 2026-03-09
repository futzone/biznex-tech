import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { MaterialType } from "@/lib/types";

export function useMaterialTypes() {
  return useQuery({
    queryKey: ["material_types"],
    queryFn: () =>
      pb.collection("material_types").getFullList<MaterialType>({
        sort: "name",
        filter: "is_active!=false",
      }),
  });
}

export function useCreateMaterialType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; unit?: string }) =>
      pb.collection("material_types").create({ ...data, is_active: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["material_types"] }),
  });
}

export function useUpdateMaterialType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; unit?: string; is_active?: boolean }) =>
      pb.collection("material_types").update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["material_types"] }),
  });
}
