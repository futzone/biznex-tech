import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useInstallations } from "@/hooks/useInstallations";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";
import type { InstallationStatus, PaymentType } from "@/lib/types";

const statusLabels: Record<InstallationStatus, string> = {
  draft: "Qoralama",
  submitted: "Topshirilgan",
  accepted: "Qabul qilingan",
};

const statusVariants: Record<InstallationStatus, "outline" | "secondary" | "default"> = {
  draft: "outline",
  submitted: "secondary",
  accepted: "default",
};

const paymentLabels: Record<PaymentType, string> = {
  purchased: "Sotib olingan",
  rented: "Arenda",
};

export default function InstallationsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "manager";
  const canCreate = user?.role === "admin" || user?.role === "manager" || user?.role === "employee";

  const filters = !isManager && user?.id ? { employeeId: user.id } : undefined;
  const { data: installations, isLoading } = useInstallations(filters);

  const [search, setSearch] = useState("");

  const filtered = installations?.filter((inst) => {
    const clientName = inst.expand?.client?.name || "";
    return clientName.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">O'rnatishlar</h1>
          <p className="text-muted-foreground">O'rnatishlar ro'yxati</p>
        </div>
        {canCreate && (
          <Link href="/installations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yangi o'rnatish
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mijoz nomi</TableHead>
            <TableHead>O'rnatuvchi</TableHead>
            <TableHead>Shartnoma</TableHead>
            <TableHead>Sana</TableHead>
            <TableHead>To'lov turi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered?.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                O'rnatishlar topilmadi
              </TableCell>
            </TableRow>
          )}
          {filtered?.map((inst) => (
            <TableRow key={inst.id}>
              <TableCell className="font-medium">
                {inst.expand?.client?.name || "-"}
              </TableCell>
              <TableCell>
                {inst.expand?.installer_employee?.name || "-"}
              </TableCell>
              <TableCell>{inst.contract_number || "-"}</TableCell>
              <TableCell>
                {inst.installation_date
                  ? format(new Date(inst.installation_date), "dd.MM.yyyy")
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={inst.payment_type === "purchased" ? "default" : "secondary"}>
                  {paymentLabels[inst.payment_type] || inst.payment_type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[inst.status]}>
                  {statusLabels[inst.status] || inst.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/installations/${inst.id}`}>
                  <Button variant="ghost" size="icon" title="Ko'rish">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
