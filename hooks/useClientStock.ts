import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { ClientStock } from "@/lib/types";

export function useClientStock(clientId?: string) {
  return useQuery({
    queryKey: ["client_stock", clientId],
    queryFn: () =>
      pb.collection("client_stock").getFullList<ClientStock>({
        filter: clientId ? `client="${clientId}"` : "",
        expand: "device_type,client",
        sort: "created",
      }),
    enabled: clientId !== "",
  });
}

export function useUpdateClientStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientId,
      deviceTypeId,
      quantityChange,
    }: {
      clientId: string;
      deviceTypeId: string;
      quantityChange: number;
    }) => {
      const existing = await pb
        .collection("client_stock")
        .getFullList<ClientStock>({
          filter: `client="${clientId}" && device_type="${deviceTypeId}"`,
        });

      if (existing.length > 0) {
        return pb
          .collection("client_stock")
          .update(existing[0].id, {
            quantity: existing[0].quantity + quantityChange,
          });
      } else {
        return pb.collection("client_stock").create({
          client: clientId,
          device_type: deviceTypeId,
          quantity: quantityChange,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client_stock"] }),
  });
}
