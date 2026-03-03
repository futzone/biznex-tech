import { useAuth } from "@/context/AuthContext";
import { useWarehouseStock } from "@/hooks/useWarehouseStock";
import { useAllEmployeeStock, useEmployeeStock } from "@/hooks/useEmployeeStock";
import { useTransactions } from "@/hooks/useTransactions";
import { useClients } from "@/hooks/useClients";
import { useExpenses } from "@/hooks/useExpenses";
import { useAssignments } from "@/hooks/useAssignments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Warehouse,
  Users,
  Building2,
  ArrowLeftRight,
  Receipt,
  Package,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import type { TransactionType } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const typeLabels: Record<TransactionType, string> = {
  warehouse_to_employee: "Ombor → Xodim",
  employee_to_client: "Xodim → Mijoz",
  client_to_employee: "Mijoz → Xodim",
  employee_to_warehouse: "Xodim → Ombor",
  adjustment: "Tuzatish",
};

const statusLabels: Record<string, string> = {
  assigned: "Biriktirilgan",
  in_progress: "Jarayonda",
  completed: "Tugatilgan",
  cancelled: "Bekor qilingan",
};

function ManagerDashboard() {
  const { data: warehouseStock } = useWarehouseStock();
  const { data: employeeStock } = useAllEmployeeStock();
  const { data: transactions } = useTransactions();
  const { data: clients } = useClients();
  const { data: expenses } = useExpenses();

  const warehouseTotal =
    warehouseStock?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
  const fieldTotal =
    employeeStock?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
  const clientCount = clients?.length ?? 0;
  const pendingExpenses =
    expenses?.filter((e) => e.status === "pending").length ?? 0;
  const pendingExpenseTotal =
    expenses
      ?.filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + e.amount, 0) ?? 0;

  const recentTransactions = transactions?.slice(0, 10) ?? [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Omborxona</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouseTotal}</div>
            <p className="text-xs text-muted-foreground">ta device omborda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Xodimlarda</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fieldTotal}</div>
            <p className="text-xs text-muted-foreground">ta device xodimlarda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mijozlar</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
            <p className="text-xs text-muted-foreground">faol mijoz</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kutilayotgan xarajatlar</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">
              {pendingExpenseTotal.toLocaleString()} so'm
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Omborxona zaxirasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warehouseStock?.length === 0 ? (
              <p className="text-muted-foreground text-sm">Ma'lumot yo'q</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Soni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouseStock?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.expand?.device_type?.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {s.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Oxirgi tranzaksiyalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Tranzaksiyalar yo'q</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[tx.type]}
                      </Badge>
                      <p className="text-sm mt-1">
                        {tx.expand?.device_type?.name} x{tx.quantity}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tx.created), "dd.MM HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: stock } = useEmployeeStock(user?.id);
  const { data: assignments } = useAssignments({ employeeId: user?.id });
  const { data: expenses } = useExpenses({ employeeId: user?.id });
  const { data: transactions } = useTransactions({ employeeId: user?.id });

  const totalDevices =
    stock?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
  const activeAssignments =
    assignments?.filter((a) => a.status === "assigned" || a.status === "in_progress").length ?? 0;
  const pendingExpenses =
    expenses?.filter((e) => e.status === "pending").length ?? 0;
  const pendingExpenseTotal =
    expenses
      ?.filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + e.amount, 0) ?? 0;

  const recentTransactions = transactions?.slice(0, 10) ?? [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Qo'limdagi devicelar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <Link href="/my-devices">
              <Button variant="link" className="px-0 h-auto text-xs">
                Batafsil ko'rish
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faol topshiriqlar</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
            <Link href="/assignments">
              <Button variant="link" className="px-0 h-auto text-xs">
                Batafsil ko'rish
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kutilayotgan xarajatlar</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">
              {pendingExpenseTotal.toLocaleString()} so'm
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Devicelarim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stock?.filter((s) => s.quantity > 0).length === 0 ? (
              <p className="text-muted-foreground text-sm">Hech qanday device yo'q</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Soni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock
                    ?.filter((s) => s.quantity > 0)
                    .map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.expand?.device_type?.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {s.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* My Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Oxirgi harakatlarim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Harakatlar yo'q</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[tx.type]}
                      </Badge>
                      <p className="text-sm mt-1">
                        {tx.expand?.device_type?.name} x{tx.quantity}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tx.created), "dd.MM HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      {assignments && assignments.filter((a) => a.status !== "completed" && a.status !== "cancelled").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Faol topshiriqlarim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments
                  .filter((a) => a.status !== "completed" && a.status !== "cancelled")
                  .map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.expand?.client?.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {statusLabels[a.status] || a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(a.assigned_date), "dd.MM.yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {isEmployee ? `Salom, ${user?.name || "Xodim"}!` : "Dashboard"}
      </h1>

      {isEmployee ? <EmployeeDashboard /> : <ManagerDashboard />}
    </div>
  );
}
