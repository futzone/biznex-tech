import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { EmployeeMaterial } from "@/lib/types";

export function useEmployeeMaterials(employeeId?: string) {
  return useQuery({
    queryKey: ["employee_materials", employeeId],
    queryFn: () =>
      pb.collection("employee_materials").getFullList<EmployeeMaterial>({
        filter: employeeId ? `employee="${employeeId}"` : "",
        expand: "employee,material_type",
        sort: "material_type",
      }),
    enabled: !!employeeId,
  });
}

export function useUpdateEmployeeMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      materialTypeId,
      quantityChange,
    }: {
      employeeId: string;
      materialTypeId: string;
      quantityChange: number;
    }) => {
      // Find existing record
      const existing = await pb
        .collection("employee_materials")
        .getFullList<EmployeeMaterial>({
          filter: `employee="${employeeId}" && material_type="${materialTypeId}"`,
        });

      if (existing.length > 0) {
        const record = existing[0];
        return pb.collection("employee_materials").update(record.id, {
          quantity: record.quantity + quantityChange,
        });
      } else {
        return pb.collection("employee_materials").create({
          employee: employeeId,
          material_type: materialTypeId,
          quantity: quantityChange,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee_materials"] });
    },
  });
}
