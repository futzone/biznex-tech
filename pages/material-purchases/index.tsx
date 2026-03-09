import { useState } from "react";
import {
  useMaterialPurchases,
  useCreateMaterialPurchase,
} from "@/hooks/useMaterialPurchases";
import { useMaterialTypes } from "@/hooks/useMaterialTypes";
import { useEmployees } from "@/hooks/useEmployees";
import { useClients } from "@/hooks/useClients";
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
import { Plus, Boxes, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const unitLabels: Record<string, string> = {
  meter: "metr",
  piece: "dona",
  roll: "rulon",
  kg: "kg",
};

export default function MaterialPurchasesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "admin" || user?.role === "manager";

  const { data: employees } = useEmployees();
  const { data: materialTypes } = useMaterialTypes();
  const { data: clients } = useClients();

  // For employee role, show only their purchases
  const [filterEmployee, setFilterEmployee] = useState("");
  const empFilter = isManager
    ? (filterEmployee && filterEmployee !== "all" ? filterEmployee : undefined)
    : user?.id;

  const { data: purchases, isLoading } = useMaterialPurchases(
    empFilter ? { employeeId: empFilter } : undefined
  );
  const createPurchase = useCreateMaterialPurchase();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [materialType, setMaterialType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costUsd, setCostUsd] = useState("");
  const [forClient, setForClient] = useState("");
  const [purchaseEmployee, setPurchaseEmployee] = useState("");
  const [notes, setNotes] = useState("");

  const totalSpent = purchases?.reduce((s, p) => s + p.cost_usd, 0) ?? 0;
  const totalItems = purchases?.length ?? 0;

  function openCreate() {
    setMaterialType("");
    setQuantity("");
    setCostUsd("");
    setForClient("");
    setPurchaseEmployee(isManager ? "" : user?.id || "");
    setNotes("");
    setDialogOpen(true);
  }

  async function handleCreate() {
    const empId = isManager ? purchaseEmployee : user?.id;
    if (!empId || !materialType || !quantity || !costUsd) return;
    try {
      await createPurchase.mutateAsync({
        employee: empId,
        material_type: materialType,
        quantity: parseFloat(quantity),
        cost_usd: parseFloat(costUsd),
        for_client: forClient && forClient !== "none" ? forClient : undefined,
        date: new Date().toISOString(),
        notes,
        recorded_by: user!.id,
      });
      toast.success("Material sotib olindi");
      setDialogOpen(false);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  const selectedMaterialType = materialTypes?.find(
    (m) => m.id === materialType
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material sotib olish</h1>
          <p className="text-muted-foreground">
            Materiallarni sotib oling va xodim qo&apos;liga qo&apos;shing
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Sotib olish
        </Button>
      </div>

      {isManager && (
        <div className="max-w-xs">
          <Label>Xodim bo&apos;yicha filtr</Label>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Barchasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {employees?.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name || emp.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Jami sotib olishlar
            </CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Jami sarflangan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
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
              {isManager && <TableHead>Xodim</TableHead>}
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Miqdori</TableHead>
              <TableHead className="text-right">Narxi ($)</TableHead>
              <TableHead>Mijoz uchun</TableHead>
              <TableHead>Izoh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isManager ? 7 : 6}
                  className="text-center text-muted-foreground"
                >
                  Sotib olishlar topilmadi
                </TableCell>
              </TableRow>
            )}
            {purchases?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                  {p.date
                    ? format(new Date(p.date), "dd.MM.yyyy")
                    : format(new Date(p.created), "dd.MM.yyyy")}
                </TableCell>
                {isManager && (
                  <TableCell>
                    {p.expand?.employee?.name || p.expand?.employee?.email || "—"}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="secondary">
                    {p.expand?.material_type?.name ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {p.quantity}{" "}
                  <span className="text-muted-foreground text-xs">
                    {unitLabels[p.expand?.material_type?.unit || ""] || ""}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${p.cost_usd.toFixed(2)}
                </TableCell>
                <TableCell className="text-sm">
                  {p.expand?.for_client?.name || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {p.notes || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Material sotib olish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isManager && (
              <div className="space-y-2">
                <Label>Xodim *</Label>
                <Select
                  value={purchaseEmployee}
                  onValueChange={setPurchaseEmployee}
                >
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
            )}

            <div className="space-y-2">
              <Label>Material turi *</Label>
              <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes?.map((mt) => (
                    <SelectItem key={mt.id} value={mt.id}>
                      {mt.name} ({unitLabels[mt.unit] || mt.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Miqdori *
                {selectedMaterialType && (
                  <span className="text-muted-foreground ml-1">
                    ({unitLabels[selectedMaterialType.unit] || selectedMaterialType.unit})
                  </span>
                )}
              </Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={
                  selectedMaterialType?.unit === "meter"
                    ? "Masalan: 100"
                    : "Masalan: 10"
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Narxi ($) *</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={costUsd}
                onChange={(e) => setCostUsd(e.target.value)}
                placeholder="Masalan: 50"
              />
            </div>

            <div className="space-y-2">
              <Label>Qaysi mijoz uchun (ixtiyoriy)</Label>
              <Select value={forClient} onValueChange={setForClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlanmagan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanlanmagan</SelectItem>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Izoh</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ixtiyoriy izoh"
              />
            </div>

            <Button
              onClick={handleCreate}
              className="w-full"
              disabled={
                !materialType ||
                !quantity ||
                !costUsd ||
                (isManager && !purchaseEmployee) ||
                createPurchase.isPending
              }
            >
              Sotib olish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
