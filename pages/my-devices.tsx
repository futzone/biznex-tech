import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useEmployeeStock, useUpdateEmployeeStock } from "@/hooks/useEmployeeStock";
import { useUpdateClientStock } from "@/hooks/useClientStock";
import { useUpdateWarehouseStock } from "@/hooks/useWarehouseStock";
import { useCreateTransaction, useTransactions } from "@/hooks/useTransactions";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Send, Undo2, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { TransactionType } from "@/lib/types";

const typeLabels: Record<TransactionType, string> = {
  warehouse_to_employee: "Ombor → Men",
  employee_to_client: "Men → Mijoz",
  client_to_employee: "Mijoz → Men",
  employee_to_warehouse: "Men → Ombor",
  adjustment: "Tuzatish",
};

export default function MyDevicesPage() {
  const { user } = useAuth();
  const { data: stock, isLoading } = useEmployeeStock(user?.id);
  const { data: clients } = useClients();
  const { data: transactions } = useTransactions({ employeeId: user?.id });

  const updateEmployeeStock = useUpdateEmployeeStock();
  const updateClientStock = useUpdateClientStock();
  const updateWarehouseStock = useUpdateWarehouseStock();
  const createTransaction = useCreateTransaction();

  const [installOpen, setInstallOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDeviceType, setSelectedDeviceType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const totalDevices =
    stock?.filter((s) => s.quantity > 0).reduce((sum, s) => sum + s.quantity, 0) ?? 0;

  async function handleInstallToClient() {
    if (!user || !selectedClient || !selectedDeviceType || !quantity) return;
    const qty = parseInt(quantity);

    const stockItem = stock?.find((s) => s.device_type === selectedDeviceType);
    if (!stockItem || stockItem.quantity < qty) {
      toast.error("Yetarli device yo'q");
      return;
    }

    try {
      await updateEmployeeStock.mutateAsync({
        employeeId: user.id,
        deviceTypeId: selectedDeviceType,
        quantityChange: -qty,
      });
      await updateClientStock.mutateAsync({
        clientId: selectedClient,
        deviceTypeId: selectedDeviceType,
        quantityChange: qty,
      });
      await createTransaction.mutateAsync({
        type: "employee_to_client",
        device_type: selectedDeviceType,
        quantity: qty,
        from_employee: user.id,
        client: selectedClient,
        notes: notes || "",
        performed_by: user.id,
      });
      toast.success("Device mijozga o'rnatildi");
      setInstallOpen(false);
      resetForm();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleReturnToWarehouse() {
    if (!user || !selectedDeviceType || !quantity) return;
    const qty = parseInt(quantity);

    const stockItem = stock?.find((s) => s.device_type === selectedDeviceType);
    if (!stockItem || stockItem.quantity < qty) {
      toast.error("Yetarli device yo'q");
      return;
    }

    try {
      await updateEmployeeStock.mutateAsync({
        employeeId: user.id,
        deviceTypeId: selectedDeviceType,
        quantityChange: -qty,
      });
      await updateWarehouseStock.mutateAsync({
        deviceTypeId: selectedDeviceType,
        quantityChange: qty,
      });
      await createTransaction.mutateAsync({
        type: "employee_to_warehouse",
        device_type: selectedDeviceType,
        quantity: qty,
        from_employee: user.id,
        notes: notes || "",
        performed_by: user.id,
      });
      toast.success("Device omborga qaytarildi");
      setReturnOpen(false);
      resetForm();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  function resetForm() {
    setSelectedClient("");
    setSelectedDeviceType("");
    setQuantity("");
    setNotes("");
  }

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  const activeStock = stock?.filter((s) => s.quantity > 0) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mening devicelarim</h1>
          <p className="text-muted-foreground">
            Qo'lingizdagi devicelar va harakatlar tarixi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => { resetForm(); setInstallOpen(true); }}
            disabled={activeStock.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Mijozga o'rnatish
          </Button>
          <Button
            variant="outline"
            onClick={() => { resetForm(); setReturnOpen(true); }}
            disabled={activeStock.length === 0}
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Omborga qaytarish
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Jami devicelar</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDevices}</div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Devicelar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {activeStock.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Hozircha qo'lingizda hech qanday device yo'q
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device turi</TableHead>
                  <TableHead className="text-right">Soni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeStock.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.expand?.device_type?.name}
                    </TableCell>
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

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Oxirgi harakatlar</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions?.length === 0 ? (
            <p className="text-muted-foreground text-sm">Hali harakatlar yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Soni</TableHead>
                  <TableHead>Izoh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.slice(0, 20).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {format(new Date(tx.created), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[tx.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.expand?.device_type?.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {tx.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Install to Client Dialog */}
      <Dialog open={installOpen} onOpenChange={setInstallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mijozga device o'rnatish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mijoz *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
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
              <Label>Device turi *</Label>
              <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {activeStock.map((s) => (
                    <SelectItem key={s.device_type} value={s.device_type}>
                      {s.expand?.device_type?.name} ({s.quantity} ta mavjud)
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
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button
              onClick={handleInstallToClient}
              className="w-full"
              disabled={!selectedClient || !selectedDeviceType || !quantity}
            >
              O'rnatish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return to Warehouse Dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Omborga qaytarish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Device turi *</Label>
              <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {activeStock.map((s) => (
                    <SelectItem key={s.device_type} value={s.device_type}>
                      {s.expand?.device_type?.name} ({s.quantity} ta)
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
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button
              onClick={handleReturnToWarehouse}
              className="w-full"
              disabled={!selectedDeviceType || !quantity}
            >
              Qaytarish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
