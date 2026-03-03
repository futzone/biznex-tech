import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { EmployeeStock } from "@/lib/types";

export function useEmployeeStock(employeeId?: string) {
  return useQuery({
    queryKey: ["employee_stock", employeeId],
    queryFn: () =>
      pb.collection("employee_stock").getFullList<EmployeeStock>({
        filter: employeeId ? `employee="${employeeId}"` : "",
        expand: "device_type,employee",
        sort: "created",
      }),
    enabled: employeeId !== "",
  });
}

export function useAllEmployeeStock() {
  return useQuery({
    queryKey: ["employee_stock"],
    queryFn: () =>
      pb.collection("employee_stock").getFullList<EmployeeStock>({
        expand: "device_type,employee",
        sort: "created",
      }),
  });
}

export function useUpdateEmployeeStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      deviceTypeId,
      quantityChange,
    }: {
      employeeId: string;
      deviceTypeId: string;
      quantityChange: number;
    }) => {
      const existing = await pb
        .collection("employee_stock")
        .getFullList<EmployeeStock>({
          filter: `employee="${employeeId}" && device_type="${deviceTypeId}"`,
        });

      if (existing.length > 0) {
        return pb
          .collection("employee_stock")
          .update(existing[0].id, {
            quantity: existing[0].quantity + quantityChange,
          });
      } else {
        return pb.collection("employee_stock").create({
          employee: employeeId,
          device_type: deviceTypeId,
          quantity: quantityChange,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee_stock"] }),
  });
}
