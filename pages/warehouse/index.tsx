import { useState } from "react";
import { useWarehouseStock, useUpdateWarehouseStock } from "@/hooks/useWarehouseStock";
import { useDeviceTypes } from "@/hooks/useDeviceTypes";
import { useEmployees } from "@/hooks/useEmployees";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUpdateEmployeeStock } from "@/hooks/useEmployeeStock";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Package, Plus, Send } from "lucide-react";
import { toast } from "sonner";

export default function WarehousePage() {
  const { user } = useAuth();
  const { data: stock, isLoading } = useWarehouseStock();
  const { data: deviceTypes } = useDeviceTypes();
  const { data: employees } = useEmployees();
  const { data: suppliers } = useSuppliers();
  const updateWarehouse = useUpdateWarehouseStock();
  const updateEmployee = useUpdateEmployeeStock();
  const createTransaction = useCreateTransaction();

  const [addOpen, setAddOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [notes, setNotes] = useState("");

  const totalDevices = stock?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;

  async function handleAddStock() {
    if (!selectedDeviceType || !quantity) return;
    const qty = parseInt(quantity);
    if (qty <= 0) return;

    try {
      await updateWarehouse.mutateAsync({
        deviceTypeId: selectedDeviceType,
        quantityChange: qty,
      });
      await createTransaction.mutateAsync({
        type: "adjustment",
        device_type: selectedDeviceType,
        quantity: qty,
        supplier: selectedSupplier || undefined,
        notes: notes || "Omborga qo'shildi",
        performed_by: user!.id,
      });
      toast.success(`${qty} ta device omborga qo'shildi`);
      setAddOpen(false);
      resetForm();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleIssueToEmployee() {
    if (!selectedDeviceType || !quantity || !selectedEmployee) return;
    const qty = parseInt(quantity);
    if (qty <= 0) return;

    const stockItem = stock?.find(
      (s) => s.device_type === selectedDeviceType
    );
    if (!stockItem || stockItem.quantity < qty) {
      toast.error("Omborxonada yetarli device yo'q");
      return;
    }

    try {
      await updateWarehouse.mutateAsync({
        deviceTypeId: selectedDeviceType,
        quantityChange: -qty,
      });
      await updateEmployee.mutateAsync({
        employeeId: selectedEmployee,
        deviceTypeId: selectedDeviceType,
        quantityChange: qty,
      });
      await createTransaction.mutateAsync({
        type: "warehouse_to_employee",
        device_type: selectedDeviceType,
        quantity: qty,
        to_employee: selectedEmployee,
        notes: notes || "",
        performed_by: user!.id,
      });
      toast.success(`${qty} ta device xodimga berildi`);
      setIssueOpen(false);
      resetForm();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  function resetForm() {
    setSelectedDeviceType("");
    setQuantity("");
    setSelectedEmployee("");
    setSelectedSupplier("");
    setNotes("");
  }

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Omborxona</h1>
          <p className="text-muted-foreground">
            Device zaxirasi va boshqaruvi
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Stock qo'shish
          </Button>
          <Button
            variant="outline"
            onClick={() => { resetForm(); setIssueOpen(true); }}
          >
            <Send className="h-4 w-4 mr-2" />
            Xodimga berish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jami devicelar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Device turlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device turi</TableHead>
            <TableHead className="text-right">Soni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stock?.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                Omborxona bo'sh
              </TableCell>
            </TableRow>
          )}
          {stock?.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">
                {s.expand?.device_type?.name ?? s.device_type}
              </TableCell>
              <TableCell className="text-right font-mono">{s.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Stock Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Omborga stock qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Device turi *</Label>
              <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes?.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Yetkazib beruvchi *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Yetkazib beruvchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Soni *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Izoh</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ixtiyoriy izoh"
              />
            </div>
            <Button onClick={handleAddStock} className="w-full" disabled={!selectedDeviceType || !quantity || !selectedSupplier}>
              Qo'shish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue to Employee Dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xodimga device berish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Xodim *</Label>
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
            <div className="space-y-2">
              <Label>Device turi *</Label>
              <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes?.map((dt) => {
                    const s = stock?.find((st) => st.device_type === dt.id);
                    return (
                      <SelectItem key={dt.id} value={dt.id}>
                        {dt.name} ({s?.quantity ?? 0} ta mavjud)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Soni *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
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
              onClick={handleIssueToEmployee}
              className="w-full"
              disabled={!selectedDeviceType || !quantity || !selectedEmployee}
            >
              Berish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
