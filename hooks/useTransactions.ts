import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { Transaction, TransactionType } from "@/lib/types";

interface TransactionFilters {
  type?: TransactionType;
  employeeId?: string;
  clientId?: string;
  deviceTypeId?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  const parts: string[] = [];
  if (filters?.type) parts.push(`type="${filters.type}"`);
  if (filters?.employeeId)
    parts.push(
      `(from_employee="${filters.employeeId}" || to_employee="${filters.employeeId}")`
    );
  if (filters?.clientId) parts.push(`client="${filters.clientId}"`);
  if (filters?.deviceTypeId)
    parts.push(`device_type="${filters.deviceTypeId}"`);

  const filter = parts.join(" && ");

  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () =>
      pb.collection("transactions").getFullList<Transaction>({
        filter,
        expand: "device_type,from_employee,to_employee,client,performed_by,supplier",
        sort: "-created",
      }),
  });
}

export interface CreateTransactionInput {
  type: TransactionType;
  device_type: string;
  quantity: number;
  from_employee?: string;
  to_employee?: string;
  client?: string;
  supplier?: string;
  serial_numbers?: string;
  notes?: string;
  performed_by: string;
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionInput) =>
      pb.collection("transactions").create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["warehouse_stock"] });
      qc.invalidateQueries({ queryKey: ["employee_stock"] });
      qc.invalidateQueries({ queryKey: ["client_stock"] });
    },
  });
}
