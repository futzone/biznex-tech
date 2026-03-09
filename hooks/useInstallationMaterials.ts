import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { InstallationMaterial, EmployeeMaterial } from "@/lib/types";

export function useInstallationMaterials(installationId: string) {
  return useQuery({
    queryKey: ["installation_materials", installationId],
    queryFn: () =>
      pb.collection("installation_materials").getFullList<InstallationMaterial>({
        filter: `installation="${installationId}"`,
        expand: "material_type",
      }),
    enabled: !!installationId,
  });
}

async function adjustEmployeeMaterial(
  employeeId: string,
  materialTypeId: string,
  quantityChange: number
) {
  if (quantityChange === 0) return;
  const existing = await pb
    .collection("employee_materials")
    .getFullList<EmployeeMaterial>({
      filter: `employee="${employeeId}" && material_type="${materialTypeId}"`,
    });

  if (existing.length > 0) {
    await pb.collection("employee_materials").update(existing[0].id, {
      quantity: existing[0].quantity + quantityChange,
    });
  } else if (quantityChange < 0) {
    // Xodimda bu material yo'q, lekin ishlatilmoqda — salbiy qoldiq bilan yaratamiz
    await pb.collection("employee_materials").create({
      employee: employeeId,
      material_type: materialTypeId,
      quantity: quantityChange,
    });
  }
}

export function useSaveInstallationMaterials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      installationId,
      employeeId,
      materials,
    }: {
      installationId: string;
      employeeId: string;
      materials: { material_type: string; quantity_used: number }[];
    }) => {
      // 1. Oldingi yozuvlarni o'qish (farq hisoblash uchun)
      const oldRecords = await pb
        .collection("installation_materials")
        .getFullList<InstallationMaterial>({
          filter: `installation="${installationId}"`,
        });

      const oldMap: Record<string, number> = {};
      for (const r of oldRecords) {
        oldMap[r.material_type] = r.quantity_used;
      }

      const newMap: Record<string, number> = {};
      for (const m of materials) {
        if (m.quantity_used > 0) {
          newMap[m.material_type] = m.quantity_used;
        }
      }

      // 2. Farqni hisoblash va employee_materials ni yangilash
      // Barcha material_type larni yig'ish
      const allTypes = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
      for (const mtId of allTypes) {
        const oldQty = oldMap[mtId] || 0;
        const newQty = newMap[mtId] || 0;
        const diff = newQty - oldQty;
        // diff > 0 → ko'proq ishlatildi → xodimdan ayirish (-diff)
        // diff < 0 → kamroq ishlatildi → xodimga qaytarish (+|diff|)
        if (diff !== 0) {
          await adjustEmployeeMaterial(employeeId, mtId, -diff);
        }
      }

      // 3. Eski yozuvlarni o'chirish
      for (const item of oldRecords) {
        await pb.collection("installation_materials").delete(item.id);
      }

      // 4. Yangi yozuvlarni yaratish
      for (const m of materials) {
        if (m.quantity_used > 0) {
          await pb.collection("installation_materials").create({
            installation: installationId,
            material_type: m.material_type,
            quantity_used: m.quantity_used,
          });
        }
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["installation_materials", vars.installationId] });
      qc.invalidateQueries({ queryKey: ["employee_materials"] });
    },
  });
}
