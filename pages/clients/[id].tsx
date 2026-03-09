import { useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useClient } from "@/hooks/useClients";
import { useClientStock } from "@/hooks/useClientStock";
import { useAssignments } from "@/hooks/useAssignments";
import { useTransactions } from "@/hooks/useTransactions";
import { useExpenses } from "@/hooks/useExpenses";
import { useInstallationByClient } from "@/hooks/useInstallations";
import { useInstallationDevices } from "@/hooks/useInstallationDevices";
import { useInstallationMaterials } from "@/hooks/useInstallationMaterials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, MapPin, Phone, User, FileText } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  assigned: "Biriktirilgan",
  in_progress: "Jarayonda",
  completed: "Tugatilgan",
  cancelled: "Bekor qilingan",
};

export default function ClientDetailPage() {
  const router = useRouter();
  const id = router.query.id as string;

  const { data: client, isLoading } = useClient(id);
  const { data: stock } = useClientStock(id);
  const { data: clientExpenses } = useExpenses({ clientId: id });
  const { data: installation } = useInstallationByClient(id);
  const { data: instDevices } = useInstallationDevices(installation?.id || "");
  const { data: instMaterials } = useInstallationMaterials(installation?.id || "");

  const totalExpenses = useMemo(
    () => clientExpenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0,
    [clientExpenses]
  );
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    clientExpenses?.forEach((e) => {
      const cat = e.category || "Boshqa";
      map.set(cat, (map.get(cat) || 0) + e.amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [clientExpenses]);
  const { data: assignments } = useAssignments({ clientId: id });
  const { data: transactions } = useTransactions({ clientId: id });

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;
  if (!client) return <p>Mijoz topilmadi</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
            {client.contact_person && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {client.contact_person}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {client.phone}
              </span>
            )}
            {client.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {client.address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>O'rnatilgan devicelar</CardTitle>
          </CardHeader>
          <CardContent>
            {stock?.length === 0 ? (
              <p className="text-muted-foreground text-sm">Hech qanday device o'rnatilmagan</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Soni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock?.map((s) => (
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
            <CardTitle>Topshiriqlar</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments?.length === 0 ? (
              <p className="text-muted-foreground text-sm">Topshiriqlar yo'q</p>
            ) : (
              <div className="space-y-3">
                {assignments?.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {a.expand?.employee?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.assigned_date), "dd.MM.yyyy")}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {statusLabels[a.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Xarajatlar</CardTitle>
            {totalExpenses > 0 && (
              <p className="text-xl font-bold">
                {totalExpenses.toLocaleString()} so'm
              </p>
            )}
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <p className="text-muted-foreground text-sm">Xarajatlar yo'q</p>
            ) : (
              <div className="space-y-2">
                {expensesByCategory.map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="font-mono">
                      {amt.toLocaleString()} so'm
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* O'rnatish formasi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            O&apos;rnatish formasi
          </CardTitle>
          {installation && (
            <Link href={`/installations/${installation.id}`}>
              <Button variant="outline" size="sm">Batafsil</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {!installation ? (
            <p className="text-muted-foreground text-sm">O&apos;rnatish formasi topilmadi</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={installation.status === "accepted" ? "default" : installation.status === "submitted" ? "secondary" : "outline"}>
                  {installation.status === "accepted" ? "Qabul qilingan" : installation.status === "submitted" ? "Topshirilgan" : "Qoralama"}
                </Badge>
                {installation.contract_number && (
                  <span className="text-sm text-muted-foreground">#{installation.contract_number}</span>
                )}
                {installation.payment_type && (
                  <Badge variant="outline">{installation.payment_type === "rented" ? "Arenda" : "Sotib olingan"}</Badge>
                )}
              </div>

              {instDevices && instDevices.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Devicelar</p>
                  <div className="flex flex-wrap gap-2">
                    {instDevices.map((d) => (
                      <Badge key={d.id} variant="secondary">
                        {d.expand?.device_type?.name}: {d.quantity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {instMaterials && instMaterials.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Materiallar</p>
                  <div className="flex flex-wrap gap-2">
                    {instMaterials.map((m) => (
                      <Badge key={m.id} variant="secondary">
                        {m.expand?.material_type?.name}: {m.quantity_used}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                {installation.total_received_usd > 0 && (
                  <div>
                    <span className="text-muted-foreground">Olingan: </span>
                    <span className="font-mono">${installation.total_received_usd}</span>
                  </div>
                )}
                {installation.payment_type === "rented" && installation.monthly_payment_usd > 0 && (
                  <div>
                    <span className="text-muted-foreground">Oylik: </span>
                    <span className="font-mono">${installation.monthly_payment_usd}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tranzaksiyalar tarixi</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <TableCell className="text-sm">
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
        </CardContent>
      </Card>
    </div>
  );
}
