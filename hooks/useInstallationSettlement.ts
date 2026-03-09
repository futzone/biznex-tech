import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { InstallationSettlement } from "@/lib/types";

export function useSettlement(installationId: string) {
  return useQuery({
    queryKey: ["installation_settlement", installationId],
    queryFn: async () => {
      const items = await pb
        .collection("installation_settlement")
        .getFullList<InstallationSettlement>({
          filter: `installation="${installationId}"`,
          expand: "installation,settled_by",
        });
      return items[0] || null;
    },
    enabled: !!installationId,
  });
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      installation: string;
      money_returned_usd: number;
      employee_salary_usd: number;
      notes?: string;
      settled_by: string;
    }) =>
      pb.collection("installation_settlement").create({
        ...data,
        notes: data.notes || "",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installation_settlement"] });
      qc.invalidateQueries({ queryKey: ["installations"] });
    },
  });
}
