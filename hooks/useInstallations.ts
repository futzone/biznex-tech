import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { Installation, InstallationStatus } from "@/lib/types";

interface InstallationFilters {
  clientId?: string;
  employeeId?: string;
  status?: InstallationStatus;
}

export function useInstallations(filters?: InstallationFilters) {
  const parts: string[] = [];
  if (filters?.clientId) parts.push(`client="${filters.clientId}"`);
  if (filters?.employeeId) parts.push(`installer_employee="${filters.employeeId}"`);
  if (filters?.status) parts.push(`status="${filters.status}"`);
  const filter = parts.join(" && ");

  return useQuery({
    queryKey: ["installations", filters],
    queryFn: () =>
      pb.collection("installations").getFullList<Installation>({
        filter,
        expand: "client,installer_employee",
        sort: "-created",
      }),
  });
}

export function useInstallation(id: string) {
  return useQuery({
    queryKey: ["installations", id],
    queryFn: () =>
      pb.collection("installations").getOne<Installation>(id, {
        expand: "client,installer_employee,submitted_by,accepted_by",
      }),
    enabled: !!id,
  });
}

export function useInstallationByClient(clientId: string) {
  return useQuery({
    queryKey: ["installations", "by_client", clientId],
    queryFn: async () => {
      const items = await pb.collection("installations").getFullList<Installation>({
        filter: `client="${clientId}"`,
        expand: "client,installer_employee",
      });
      return items[0] || null;
    },
    enabled: !!clientId,
  });
}

export function useCreateInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Installation>) =>
      pb.collection("installations").create<Installation>({
        ...data,
        status: "draft",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installations"] }),
  });
}

export function useUpdateInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Installation>) =>
      pb.collection("installations").update<Installation>(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installations"] }),
  });
}
