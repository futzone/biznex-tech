import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { Expense, ExpenseStatus } from "@/lib/types";

export function useExpenses(filters?: {
  employeeId?: string;
  status?: ExpenseStatus;
  assignmentId?: string;
  clientId?: string;
}) {
  const parts: string[] = [];
  if (filters?.employeeId) parts.push(`employee="${filters.employeeId}"`);
  if (filters?.status) parts.push(`status="${filters.status}"`);
  if (filters?.assignmentId) parts.push(`assignment="${filters.assignmentId}"`);
  if (filters?.clientId) parts.push(`client="${filters.clientId}"`);
  const filter = parts.join(" && ");

  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: () =>
      pb.collection("expenses").getFullList<Expense>({
        filter,
        expand: "employee,assignment,approved_by,client",
        sort: "-created",
      }),
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense_categories"],
    queryFn: async () => {
      const expenses = await pb
        .collection("expenses")
        .getFullList<Expense>({ fields: "category" });
      const categories = [
        ...new Set(expenses.map((e) => e.category).filter(Boolean)),
      ];
      return categories.sort();
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => pb.collection("expenses").create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense_categories"] });
    },
  });
}

export function useUpdateExpenseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      approved_by,
    }: {
      id: string;
      status: ExpenseStatus;
      approved_by?: string;
    }) => pb.collection("expenses").update(id, { status, approved_by }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
