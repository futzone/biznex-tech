import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { MaterialPurchase, EmployeeMaterial } from "@/lib/types";

interface PurchaseFilters {
  employeeId?: string;
}

export function useMaterialPurchases(filters?: PurchaseFilters) {
  const parts: string[] = [];
  if (filters?.employeeId) parts.push(`employee="${filters.employeeId}"`);
  const filter = parts.join(" && ");

  return useQuery({
    queryKey: ["material_purchases", filters],
    queryFn: () =>
      pb.collection("material_purchases").getFullList<MaterialPurchase>({
        filter,
        expand: "employee,material_type,for_client",
        sort: "-created",
      }),
  });
}

export function useCreateMaterialPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      employee: string;
      material_type: string;
      quantity: number;
      cost_usd: number;
      for_client?: string;
      date: string;
      notes?: string;
      recorded_by: string;
    }) => {
      // 1. Create purchase record
      const purchase = await pb.collection("material_purchases").create({
        employee: data.employee,
        material_type: data.material_type,
        quantity: data.quantity,
        cost_usd: data.cost_usd,
        for_client: data.for_client || "",
        date: data.date,
        notes: data.notes || "",
      });

      // 2. Create cash entry (spent_on_material)
      await pb.collection("employee_cash").create({
        employee: data.employee,
        type: "spent_on_material",
        amount_usd: data.cost_usd,
        description: `Material sotib olindi: ${data.notes || ""}`,
        date: data.date,
        recorded_by: data.recorded_by,
      });

      // 3. Update employee_materials (add quantity)
      const existing = await pb
        .collection("employee_materials")
        .getFullList<EmployeeMaterial>({
          filter: `employee="${data.employee}" && material_type="${data.material_type}"`,
        });

      if (existing.length > 0) {
        await pb.collection("employee_materials").update(existing[0].id, {
          quantity: existing[0].quantity + data.quantity,
        });
      } else {
        await pb.collection("employee_materials").create({
          employee: data.employee,
          material_type: data.material_type,
          quantity: data.quantity,
        });
      }

      return purchase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material_purchases"] });
      qc.invalidateQueries({ queryKey: ["employee_cash"] });
      qc.invalidateQueries({ queryKey: ["employee_materials"] });
    },
  });
}
