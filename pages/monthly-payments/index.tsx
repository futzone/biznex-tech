import { useInstallations } from "@/hooks/useInstallations";
import { useMonthlyPayments, useMarkPaymentPaid } from "@/hooks/useMonthlyPayments";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CalendarCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MonthlyPaymentsPage() {
  const { data: installations } = useInstallations();
  const { data: payments, isLoading } = useMonthlyPayments();
  const markPaid = useMarkPaymentPaid();

  // Arenda installations
  const rentedInstallations = installations?.filter(
    (i) => i.payment_type === "rented"
  );

  // Unpaid count
  const unpaidCount = payments?.filter((p) => !p.paid).length ?? 0;

  async function handleMarkPaid(id: string) {
    try {
      await markPaid.mutateAsync({ id, paid_date: new Date().toISOString() });
      toast.success("To'lov belgilandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Oylik to'lovlar</h1>
        <p className="text-muted-foreground">Arenda mijozlarining oylik to'lovlari</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Arenda mijozlar</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentedInstallations?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">To'lanmagan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unpaidCount}</div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mijoz</TableHead>
            <TableHead>Oy</TableHead>
            <TableHead className="text-right">Summa ($)</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead className="w-[100px]">Amal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                To'lovlar topilmadi
              </TableCell>
            </TableRow>
          )}
          {payments?.map((p) => {
            const inst = installations?.find((i) => i.id === p.installation);
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {inst?.expand?.client?.name ?? "—"}
                </TableCell>
                <TableCell>
                  {format(new Date(p.month), "MMMM yyyy")}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${p.amount_usd.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={p.paid ? "default" : "outline"}>
                    {p.paid ? "To'langan" : "Kutilmoqda"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {!p.paid && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkPaid(p.id)}
                      disabled={markPaid.isPending}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
