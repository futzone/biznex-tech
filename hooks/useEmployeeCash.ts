import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { EmployeeCash, CashEntryType } from "@/lib/types";

export function useEmployeeCash(employeeId?: string) {
  return useQuery({
    queryKey: ["employee_cash", employeeId],
    queryFn: () =>
      pb.collection("employee_cash").getFullList<EmployeeCash>({
        filter: employeeId ? `employee="${employeeId}"` : "",
        expand: "employee,installation,recorded_by",
        sort: "-created",
      }),
    enabled: !!employeeId,
  });
}

export function useEmployeeCashBalance(employeeId: string) {
  return useQuery({
    queryKey: ["employee_cash_balance", employeeId],
    queryFn: async () => {
      const entries = await pb.collection("employee_cash").getFullList<EmployeeCash>({
        filter: `employee="${employeeId}"`,
        fields: "type,amount_usd",
      });
      let balance = 0;
      for (const e of entries) {
        if (e.type === "received_from_client" || e.type === "given_by_company") {
          balance += e.amount_usd;
        } else {
          balance -= e.amount_usd;
        }
      }
      return balance;
    },
    enabled: !!employeeId,
  });
}

export function useCreateCashEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employee: string;
      type: CashEntryType;
      amount_usd: number;
      installation?: string;
      description?: string;
      date: string;
      recorded_by: string;
    }) =>
      pb.collection("employee_cash").create({
        ...data,
        installation: data.installation || "",
        description: data.description || "",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee_cash"] });
      qc.invalidateQueries({ queryKey: ["employee_cash_balance"] });
    },
  });
}
