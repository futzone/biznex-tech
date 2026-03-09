import { useState } from "react";
import {
  useEmployeeCash,
  useEmployeeCashBalance,
  useCreateCashEntry,
} from "@/hooks/useEmployeeCash";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, DollarSign, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { CashEntryType } from "@/lib/types";

const typeLabels: Record<CashEntryType, string> = {
  received_from_client: "Mijozdan olindi",
  spent_on_material: "Materialga sarflandi",
  returned_to_company: "Kompaniyaga qaytarildi",
  given_by_company: "Kompaniyadan berildi",
};

const typeColors: Record<CashEntryType, "default" | "secondary" | "destructive" | "outline"> = {
  received_from_client: "default",
  spent_on_material: "destructive",
  returned_to_company: "outline",
  given_by_company: "secondary",
};

export default function EmployeeCashPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "admin" || user?.role === "manager";

  const { data: employees } = useEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const empId = isManager ? selectedEmployee : user?.id || "";

  const { data: entries, isLoading } = useEmployeeCash(empId || undefined);
  const { data: balance } = useEmployeeCashBalance(empId);
  const createEntry = useCreateCashEntry();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<CashEntryType>("given_by_company");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [entryEmployee, setEntryEmployee] = useState("");

  function openCreate() {
    setEntryType("given_by_company");
    setAmount("");
    setDescription("");
    setEntryEmployee(empId);
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!amount || !entryEmployee) return;
    try {
      await createEntry.mutateAsync({
        employee: entryEmployee,
        type: entryType,
        amount_usd: parseFloat(amount),
        description,
        date: new Date().toISOString(),
        recorded_by: user!.id,
      });
      toast.success("Yozuv qo'shildi");
      setDialogOpen(false);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pul aylanmasi</h1>
          <p className="text-muted-foreground">Xodimlarning pul oqimini kuzating</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi yozuv
          </Button>
        )}
      </div>

      {isManager && (
        <div className="max-w-xs">
          <Label>Xodim</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Xodimni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {employees?.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name || emp.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {empId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Joriy balans</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${(balance ?? 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Jami kirim</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(entries
                    ?.filter((e) => e.type === "received_from_client" || e.type === "given_by_company")
                    .reduce((s, e) => s + e.amount_usd, 0) ?? 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Jami chiqim</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(entries
                    ?.filter((e) => e.type === "spent_on_material" || e.type === "returned_to_company")
                    .reduce((s, e) => s + e.amount_usd, 0) ?? 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead className="text-right">Summa ($)</TableHead>
                  <TableHead>Tavsif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Yozuvlar topilmadi
                    </TableCell>
                  </TableRow>
                )}
                {entries?.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">
                      {e.date ? format(new Date(e.date), "dd.MM.yyyy") : format(new Date(e.created), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeColors[e.type]}>
                        {typeLabels[e.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {e.type === "received_from_client" || e.type === "given_by_company"
                        ? `+$${e.amount_usd.toFixed(2)}`
                        : `-$${e.amount_usd.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {e.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {!empId && !isManager && (
        <p className="text-muted-foreground">Ma'lumot topilmadi</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi pul yozuvi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Xodim *</Label>
              <Select value={entryEmployee} onValueChange={setEntryEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Turi *</Label>
              <Select value={entryType} onValueChange={(v) => setEntryType(v as CashEntryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="given_by_company">Kompaniyadan berildi</SelectItem>
                  <SelectItem value="received_from_client">Mijozdan olindi</SelectItem>
                  <SelectItem value="spent_on_material">Materialga sarflandi</SelectItem>
                  <SelectItem value="returned_to_company">Kompaniyaga qaytarildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Summa ($) *</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ixtiyoriy izoh"
              />
            </div>
            <Button
              onClick={handleCreate}
              className="w-full"
              disabled={!entryEmployee || !amount || createEntry.isPending}
            >
              Qo'shish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
