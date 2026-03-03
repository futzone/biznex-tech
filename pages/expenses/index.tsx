import { useState, useRef, useMemo } from "react";
import {
  useExpenses,
  useExpenseCategories,
  useCreateExpense,
  useUpdateExpenseStatus,
} from "@/hooks/useExpenses";
import { useClients } from "@/hooks/useClients";
import { useDeviceTypes } from "@/hooks/useDeviceTypes";
import { useAssignments } from "@/hooks/useAssignments";
import { useAuth } from "@/context/AuthContext";
import pb from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check, X, FileImage, Building2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ExpenseStatus } from "@/lib/types";

const statusLabels: Record<ExpenseStatus, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
};

const statusColors: Record<
  ExpenseStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

const defaultCategories = [
  "Transport",
  "Yoqilg'i",
  "Mehmonxona",
  "Ovqat",
  "Kabel",
  "Material",
  "Boshqa",
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "manager";
  const isEmployee = user?.role === "employee";

  const { data: expenses, isLoading } = useExpenses(
    isEmployee ? { employeeId: user?.id } : undefined
  );
  const { data: clients } = useClients();
  const { data: deviceTypes } = useDeviceTypes();
  const { data: savedCategories } = useExpenseCategories();
  const { data: assignments } = useAssignments(
    isEmployee ? { employeeId: user?.id } : undefined
  );
  const createMutation = useCreateExpense();
  const updateStatusMutation = useUpdateExpenseStatus();

  const [createOpen, setCreateOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [clientId, setClientId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  // Merge default + device types + saved categories
  const allCategories = useMemo(() => {
    const merged = new Set(defaultCategories);
    deviceTypes?.forEach((dt) => merged.add(dt.name));
    savedCategories?.forEach((c) => merged.add(c));
    return [...merged].sort();
  }, [deviceTypes, savedCategories]);

  // Client expenses summary
  const clientExpenseSummary = useMemo(() => {
    if (!expenses) return [];
    const map = new Map<
      string,
      { clientId: string; clientName: string; total: number; count: number }
    >();
    for (const e of expenses) {
      if (!e.client) continue;
      const existing = map.get(e.client);
      const clientName = e.expand?.client?.name || "Noma'lum";
      if (existing) {
        existing.total += e.amount;
        existing.count += 1;
      } else {
        map.set(e.client, {
          clientId: e.client,
          clientName,
          total: e.amount,
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [expenses]);

  const finalCategory =
    category === "__custom__" ? customCategory.trim() : category;

  async function handleCreate() {
    if (!amount || !description || !finalCategory) return;

    try {
      const formData = new FormData();
      formData.append("employee", user!.id);
      formData.append("category", finalCategory);
      formData.append("amount", amount);
      formData.append("description", description);
      formData.append("date", date);
      formData.append("status", "pending");
      if (clientId) formData.append("client", clientId);
      if (assignmentId) formData.append("assignment", assignmentId);
      if (receipt) formData.append("receipt", receipt);

      await createMutation.mutateAsync(formData);
      toast.success("Xarajat qo'shildi");
      setCreateOpen(false);
      resetForm();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleApprove(id: string) {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: "approved",
        approved_by: user!.id,
      });
      toast.success("Tasdiqlandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleReject(id: string) {
    try {
      await updateStatusMutation.mutateAsync({ id, status: "rejected" });
      toast.success("Rad etildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  function resetForm() {
    setCategory("");
    setCustomCategory("");
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setClientId("");
    setAssignmentId("");
    setReceipt(null);
  }

  function getReceiptUrl(expense: {
    id: string;
    receipt: string;
    collectionId: string;
  }) {
    if (!expense.receipt) return null;
    return pb.files.getURL(expense, expense.receipt);
  }

  if (isLoading)
    return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  const totalPending =
    expenses
      ?.filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + e.amount, 0) ?? 0;

  const totalApproved =
    expenses
      ?.filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + e.amount, 0) ?? 0;

  const totalAll =
    expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xarajatlar</h1>
          <p className="text-muted-foreground">
            Jami: {totalAll.toLocaleString()} | Kutilmoqda:{" "}
            {totalPending.toLocaleString()} | Tasdiqlangan:{" "}
            {totalApproved.toLocaleString()} so'm
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Yangi xarajat
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Barcha xarajatlar</TabsTrigger>
          <TabsTrigger value="by-client">Mijoz bo'yicha</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                {isManager && <TableHead>Xodim</TableHead>}
                <TableHead>Mijoz</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Tavsif</TableHead>
                <TableHead className="text-right">Summa</TableHead>
                <TableHead>Chek</TableHead>
                <TableHead>Holat</TableHead>
                {isManager && <TableHead>Amallar</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isManager ? 9 : 7}
                    className="text-center text-muted-foreground"
                  >
                    Xarajatlar topilmadi
                  </TableCell>
                </TableRow>
              )}
              {expenses?.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {format(new Date(e.date), "dd.MM.yyyy")}
                  </TableCell>
                  {isManager && (
                    <TableCell>{e.expand?.employee?.name || "-"}</TableCell>
                  )}
                  <TableCell>
                    {e.expand?.client?.name || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e.category || "—"}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {e.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {e.amount.toLocaleString()} so'm
                  </TableCell>
                  <TableCell>
                    {e.receipt ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const url = getReceiptUrl(e);
                          if (url) window.open(url, "_blank");
                        }}
                      >
                        <FileImage className="h-4 w-4" />
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[e.status]}>
                      {statusLabels[e.status]}
                    </Badge>
                  </TableCell>
                  {isManager && (
                    <TableCell>
                      {e.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(e.id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(e.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="by-client" className="mt-4">
          {clientExpenseSummary.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Mijozga bog'langan xarajatlar yo'q
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientExpenseSummary.map((cs) => (
                <ClientExpenseCard
                  key={cs.clientId}
                  clientId={cs.clientId}
                  clientName={cs.clientName}
                  total={cs.total}
                  count={cs.count}
                  expenses={expenses?.filter((e) => e.client === cs.clientId) ?? []}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Expense Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi xarajat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mijoz</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Mijozni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kategoriya *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang yoki yangi kiriting" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">
                    + Yangi kategoriya kiritish
                  </SelectItem>
                </SelectContent>
              </Select>
              {category === "__custom__" && (
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Yangi kategoriya nomi"
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Summa (so'm) *</Label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Tavsif *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Xarajat tavsifi"
              />
            </div>

            <div className="space-y-2">
              <Label>Sana</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Topshiriq (ixtiyoriy)</Label>
              <Select value={assignmentId} onValueChange={setAssignmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {assignments?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.expand?.client?.name} - {a.expand?.employee?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chek/kvitansiya</Label>
              <Input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
            </div>

            <Button
              onClick={handleCreate}
              className="w-full"
              disabled={!amount || !description || !finalCategory}
            >
              Qo'shish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientExpenseCard({
  clientName,
  total,
  count,
  expenses,
}: {
  clientId: string;
  clientName: string;
  total: number;
  count: number;
  expenses: { category: string; amount: number; description: string; date: string }[];
}) {
  // Group by category
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const cat = e.category || "Boshqa";
      map.set(cat, (map.get(cat) || 0) + e.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{clientName}</CardTitle>
        </div>
        <p className="text-2xl font-bold">{total.toLocaleString()} so'm</p>
        <p className="text-xs text-muted-foreground">{count} ta xarajat</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {byCategory.map(([cat, amt]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{cat}</span>
              <span className="font-mono">{amt.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
