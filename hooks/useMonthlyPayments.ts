import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { MonthlyPayment } from "@/lib/types";

interface PaymentFilters {
  installationId?: string;
  paid?: boolean;
}

export function useMonthlyPayments(filters?: PaymentFilters) {
  const parts: string[] = [];
  if (filters?.installationId) parts.push(`installation="${filters.installationId}"`);
  if (filters?.paid !== undefined) parts.push(`paid=${filters.paid}`);
  const filter = parts.join(" && ");

  return useQuery({
    queryKey: ["monthly_payments", filters],
    queryFn: () =>
      pb.collection("monthly_payments").getFullList<MonthlyPayment>({
        filter,
        expand: "installation",
        sort: "-month",
      }),
  });
}

export function useCreateMonthlyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { installation: string; month: string; amount_usd: number }) =>
      pb.collection("monthly_payments").create({ ...data, paid: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthly_payments"] }),
  });
}

export function useMarkPaymentPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paid_date }: { id: string; paid_date: string }) =>
      pb.collection("monthly_payments").update(id, { paid: true, paid_date }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthly_payments"] }),
  });
}
