import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { Assignment, AssignmentStatus } from "@/lib/types";

export function useAssignments(filters?: { employeeId?: string; clientId?: string; status?: AssignmentStatus }) {
  const parts: string[] = [];
  if (filters?.employeeId) parts.push(`employee="${filters.employeeId}"`);
  if (filters?.clientId) parts.push(`client="${filters.clientId}"`);
  if (filters?.status) parts.push(`status="${filters.status}"`);
  const filter = parts.join(" && ");

  return useQuery({
    queryKey: ["assignments", filters],
    queryFn: () =>
      pb.collection("assignments").getFullList<Assignment>({
        filter,
        expand: "employee,client",
        sort: "-created",
      }),
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employee: string;
      client: string;
      assigned_date: string;
      notes?: string;
    }) =>
      pb.collection("assignments").create({ ...data, status: "assigned" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: AssignmentStatus; completed_date?: string; notes?: string }) =>
      pb.collection("assignments").update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}
