import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { InstallationDevice } from "@/lib/types";

export function useInstallationDevices(installationId: string) {
  return useQuery({
    queryKey: ["installation_devices", installationId],
    queryFn: () =>
      pb.collection("installation_devices").getFullList<InstallationDevice>({
        filter: `installation="${installationId}"`,
        expand: "device_type",
      }),
    enabled: !!installationId,
  });
}

export function useSaveInstallationDevices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      installationId,
      devices,
    }: {
      installationId: string;
      devices: { device_type: string; quantity: number }[];
    }) => {
      // Delete existing
      const existing = await pb
        .collection("installation_devices")
        .getFullList<InstallationDevice>({
          filter: `installation="${installationId}"`,
        });
      for (const item of existing) {
        await pb.collection("installation_devices").delete(item.id);
      }
      // Create new (only non-zero)
      for (const d of devices) {
        if (d.quantity > 0) {
          await pb.collection("installation_devices").create({
            installation: installationId,
            device_type: d.device_type,
            quantity: d.quantity,
          });
        }
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["installation_devices", vars.installationId] });
    },
  });
}
