import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { WarehouseStock } from "@/lib/types";

export function useWarehouseStock() {
  return useQuery({
    queryKey: ["warehouse_stock"],
    queryFn: () =>
      pb.collection("warehouse_stock").getFullList<WarehouseStock>({
        expand: "device_type",
        sort: "created",
      }),
  });
}

export function useUpdateWarehouseStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      deviceTypeId,
      quantityChange,
    }: {
      deviceTypeId: string;
      quantityChange: number;
    }) => {
      const existing = await pb
        .collection("warehouse_stock")
        .getFullList<WarehouseStock>({
          filter: `device_type="${deviceTypeId}"`,
        });

      if (existing.length > 0) {
        return pb
          .collection("warehouse_stock")
          .update(existing[0].id, {
            quantity: existing[0].quantity + quantityChange,
          });
      } else {
        return pb.collection("warehouse_stock").create({
          device_type: deviceTypeId,
          quantity: quantityChange,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouse_stock"] }),
  });
}
