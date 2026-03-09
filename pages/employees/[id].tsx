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
import { useEmployeeMaterials } from "@/hooks/useEmployeeMaterials";
import { useEmployeeCash, useEmployeeCashBalance } from "@/hooks/useEmployeeCash";
import { useInstallations } from "@/hooks/useInstallations";
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
import { ArrowLeft, Send, Undo2, DollarSign, Boxes } from "lucide-react";
import type { CashEntryType } from "@/lib/types";
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
  const { data: empMaterials } = useEmployeeMaterials(id);
  const { data: cashEntries } = useEmployeeCash(id);
  const { data: cashBalance } = useEmployeeCashBalance(id);
  const { data: empInstallations } = useInstallations({ employeeId: id });

  const cashTypeLabels: Record<CashEntryType, string> = {
    received_from_client: "Mijozdan olindi",
    spent_on_material: "Materialga sarflandi",
    returned_to_company: "Kompaniyaga qaytarildi",
    given_by_company: "Kompaniyadan berildi",
  };

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
        <TabsList className="flex-wrap">
          <TabsTrigger value="assignments">Topshiriqlar</TabsTrigger>
          <TabsTrigger value="materials">Materiallar</TabsTrigger>
          <TabsTrigger value="cash">Pul oqimi</TabsTrigger>
          <TabsTrigger value="installations">O&apos;rnatishlar</TabsTrigger>
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

        <TabsContent value="materials" className="mt-4">
          {empMaterials?.filter((m) => m.quantity !== 0).length === 0 ? (
            <p className="text-muted-foreground text-sm">Materiallar yo&apos;q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qoldiq</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empMaterials
                  ?.filter((m) => m.quantity !== 0)
                  .map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.expand?.material_type?.name ?? m.material_type}</TableCell>
                      <TableCell className="text-right font-mono">{m.quantity}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="cash" className="mt-4">
          <div className="mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Balans</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(cashBalance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${(cashBalance ?? 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
          {cashEntries?.length === 0 ? (
            <p className="text-muted-foreground text-sm">Pul yozuvlari yo&apos;q</p>
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
                {cashEntries?.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">
                      {e.date ? format(new Date(e.date), "dd.MM.yyyy") : format(new Date(e.created), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{cashTypeLabels[e.type]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {e.type === "received_from_client" || e.type === "given_by_company"
                        ? `+$${e.amount_usd.toFixed(2)}`
                        : `-$${e.amount_usd.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {e.description || "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="installations" className="mt-4">
          {empInstallations?.length === 0 ? (
            <p className="text-muted-foreground text-sm">O&apos;rnatishlar yo&apos;q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>To&apos;lov turi</TableHead>
                  <TableHead className="text-right">Summa ($)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empInstallations?.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell>
                      <Link href={`/installations/${inst.id}`} className="text-primary hover:underline">
                        {inst.expand?.client?.name ?? "\u2014"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inst.status === "accepted" ? "default" : inst.status === "submitted" ? "secondary" : "outline"}>
                        {inst.status === "accepted" ? "Qabul qilingan" : inst.status === "submitted" ? "Topshirilgan" : "Qoralama"}
                      </Badge>
                    </TableCell>
                    <TableCell>{inst.payment_type === "rented" ? "Arenda" : "Sotib olingan"}</TableCell>
                    <TableCell className="text-right font-mono">${inst.total_received_usd || 0}</TableCell>
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
