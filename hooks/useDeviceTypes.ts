import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { DeviceType } from "@/lib/types";

export function useDeviceTypes() {
  return useQuery({
    queryKey: ["device_types"],
    queryFn: () =>
      pb.collection("device_types").getFullList<DeviceType>({
        sort: "name",
        filter: "is_active!=false",
      }),
  });
}

export function useAllDeviceTypes() {
  return useQuery({
    queryKey: ["device_types", "all"],
    queryFn: () =>
      pb.collection("device_types").getFullList<DeviceType>({ sort: "name" }),
  });
}

export function useCreateDeviceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) =>
      pb.collection("device_types").create({ ...data, is_active: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["device_types"] }),
  });
}

export function useUpdateDeviceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; icon?: string; is_active?: boolean }) =>
      pb.collection("device_types").update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["device_types"] }),
  });
}
