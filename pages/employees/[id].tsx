import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEmployee } from "@/hooks/useEmployees";
import { useEmployeeStock, useUpdateEmployeeStock } from "@/hooks/useEmployeeStock";
import { useUpdateClientStock } from "@/hooks/useClientStock";
import { useUpdateWarehouseStock } from "@/hooks/useWarehouseStock";
import { useAssignments } from "@/hooks/useAssignments";
import { useExpenses } from "@/hooks/useExpenses";
import { useTransactions, useCreateTransaction } from "@/hooks/useTransactions";
import { useDeviceTypes } from "@/hooks/useDeviceTypes";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { user } = useAuth();

  const { data: employee, isLoading } = useEmployee(id);
  const { data: stock } = useEmployeeStock(id);
  const { data: assignments } = useAssignments({ employeeId: id });
  const { data: expenses } = useExpenses({ employeeId: id });
  const { data: transactions } = useTransactions({ employeeId: id });
  const { data: clients } = useClients();
  const { data: deviceTypes } = useDeviceTypes();

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

  async function handleInstallToClient() {
    if (!selectedClient || !selectedDeviceType || !quantity) return;
    const qty = parseInt(quantity);

    const stockItem = stock?.find((s) => s.device_type === selectedDeviceType);
    if (!stockItem || stockItem.quantity < qty) {
      toast.error("Xodimda yetarli device yo'q");
      return;
    }

    try {
      await updateEmployeeStock.mutateAsync({
        employeeId: id,
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
        from_employee: id,
        client: selectedClient,
        notes: notes || "",
        performed_by: user!.id,
      });
      toast.success("Device mijozga o'rnatildi");
      setInstallOpen(false);
      resetForm();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleReturnToWarehouse() {
    if (!selectedDeviceType || !quantity) return;
    const qty = parseInt(quantity);

    const stockItem = stock?.find((s) => s.device_type === selectedDeviceType);
    if (!stockItem || stockItem.quantity < qty) {
      toast.error("Xodimda yetarli device yo'q");
      return;
    }

    try {
      await updateEmployeeStock.mutateAsync({
        employeeId: id,
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
        from_employee: id,
        notes: notes || "",
        performed_by: user!.id,
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
  if (!employee) return <p>Xodim topilmadi</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{employee.name || employee.email}</h1>
          <p className="text-muted-foreground">{employee.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Qo'lidagi devicelar</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => { resetForm(); setInstallOpen(true); }}
            >
              <Send className="h-4 w-4 mr-2" />
              Mijozga o'rnatish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { resetForm(); setReturnOpen(true); }}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Omborga qaytarish
            </Button>
          </div>
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

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Topshiriqlar</TabsTrigger>
          <TabsTrigger value="expenses">Xarajatlar</TabsTrigger>
          <TabsTrigger value="transactions">Tranzaksiyalar</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4">
          {assignments?.length === 0 ? (
            <p className="text-muted-foreground text-sm">Topshiriqlar yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${a.client}`}
                        className="text-primary hover:underline"
                      >
                        {a.expand?.client?.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(a.assigned_date), "dd.MM.yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          {expenses?.length === 0 ? (
            <p className="text-muted-foreground text-sm">Xarajatlar yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead className="text-right">Summa</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {format(new Date(e.date), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell className="text-right font-mono">
                      {e.amount.toLocaleString()} so'm
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          {transactions?.length === 0 ? (
            <p className="text-muted-foreground text-sm">Tranzaksiyalar yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Soni</TableHead>
                  <TableHead>Izoh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {format(new Date(tx.created), "dd.MM.yyyy")}
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
        </TabsContent>
      </Tabs>

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
                  {stock
                    ?.filter((s) => s.quantity > 0)
                    .map((s) => (
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
                  {stock
                    ?.filter((s) => s.quantity > 0)
                    .map((s) => (
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
