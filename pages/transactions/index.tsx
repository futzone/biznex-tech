import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useDeviceTypes } from "@/hooks/useDeviceTypes";
import { useEmployees } from "@/hooks/useEmployees";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { TransactionType } from "@/lib/types";
import { format } from "date-fns";

const typeLabels: Record<TransactionType, string> = {
  warehouse_to_employee: "Ombor → Xodim",
  employee_to_client: "Xodim → Mijoz",
  client_to_employee: "Mijoz → Xodim",
  employee_to_warehouse: "Xodim → Ombor",
  adjustment: "Tuzatish",
};

const typeColors: Record<TransactionType, string> = {
  warehouse_to_employee: "default",
  employee_to_client: "default",
  client_to_employee: "secondary",
  employee_to_warehouse: "secondary",
  adjustment: "outline",
};

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("");

  const { data: transactions, isLoading } = useTransactions({
    type: typeFilter || undefined,
    employeeId: employeeFilter || undefined,
    deviceTypeId: deviceTypeFilter || undefined,
  });
  const { data: deviceTypes } = useDeviceTypes();
  const { data: employees } = useEmployees();

  function clearFilters() {
    setTypeFilter("");
    setEmployeeFilter("");
    setDeviceTypeFilter("");
  }

  const hasFilters = typeFilter || employeeFilter || deviceTypeFilter;

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tranzaksiyalar</h1>
        <p className="text-muted-foreground">Barcha device harakatlari tarixi</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TransactionType)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tur bo'yicha" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Xodim bo'yicha" />
          </SelectTrigger>
          <SelectContent>
            {employees?.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name || emp.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Device turi" />
          </SelectTrigger>
          <SelectContent>
            {deviceTypes?.map((dt) => (
              <SelectItem key={dt.id} value={dt.id}>
                {dt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Tozalash
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sana</TableHead>
            <TableHead>Turi</TableHead>
            <TableHead>Device</TableHead>
            <TableHead className="text-right">Soni</TableHead>
            <TableHead>Kimdan/Kimga</TableHead>
            <TableHead>Izoh</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Tranzaksiyalar topilmadi
              </TableCell>
            </TableRow>
          )}
          {transactions?.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="text-sm">
                {format(new Date(tx.created), "dd.MM.yyyy HH:mm")}
              </TableCell>
              <TableCell>
                <Badge variant={typeColors[tx.type] as "default" | "secondary" | "outline"}>
                  {typeLabels[tx.type]}
                </Badge>
              </TableCell>
              <TableCell>
                {tx.expand?.device_type?.name ?? "-"}
              </TableCell>
              <TableCell className="text-right font-mono">
                {tx.quantity}
              </TableCell>
              <TableCell className="text-sm">
                {tx.expand?.from_employee?.name && (
                  <span>
                    {tx.expand.from_employee.name}
                  </span>
                )}
                {tx.expand?.from_employee && tx.expand?.to_employee && " → "}
                {tx.expand?.to_employee?.name && (
                  <span>{tx.expand.to_employee.name}</span>
                )}
                {tx.expand?.client?.name && (
                  <span className="text-muted-foreground">
                    {" "}({tx.expand.client.name})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {tx.notes || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
