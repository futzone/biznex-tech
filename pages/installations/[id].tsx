import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useInstallation, useUpdateInstallation } from "@/hooks/useInstallations";
import {
  useInstallationDevices,
  useSaveInstallationDevices,
} from "@/hooks/useInstallationDevices";
import {
  useInstallationMaterials,
  useSaveInstallationMaterials,
} from "@/hooks/useInstallationMaterials";
import { useDeviceTypes } from "@/hooks/useDeviceTypes";
import { useMaterialTypes } from "@/hooks/useMaterialTypes";
import {
  useSettlement,
  useCreateSettlement,
} from "@/hooks/useInstallationSettlement";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { PaymentType } from "@/lib/types";

function usdToUzs(usd: number, rate: number) {
  return rate > 0 ? (usd * rate).toLocaleString() : "\u2014";
}

const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  submitted: "Topshirilgan",
  accepted: "Qabul qilingan",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "outline",
  accepted: "default",
};

const unitLabels: Record<string, string> = {
  meter: "metr",
  piece: "dona",
  roll: "rulon",
  kg: "kg",
};

export default function InstallationDetailPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { user } = useAuth();

  // Data hooks
  const { data: installation, isLoading } = useInstallation(id);
  const { data: installationDevices } = useInstallationDevices(id);
  const { data: installationMaterials } = useInstallationMaterials(id);
  const { data: deviceTypes } = useDeviceTypes();
  const { data: materialTypes } = useMaterialTypes();
  const { data: settlement } = useSettlement(id);

  // Mutation hooks
  const updateInstallation = useUpdateInstallation();
  const saveDevices = useSaveInstallationDevices();
  const saveMaterials = useSaveInstallationMaterials();
  const createSettlement = useCreateSettlement();

  // Form state
  const [contractNumber, setContractNumber] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("purchased");
  const [monthlyPaymentUsd, setMonthlyPaymentUsd] = useState(0);
  const [travelExpenseUsd, setTravelExpenseUsd] = useState(0);
  const [additionalExpensesUsd, setAdditionalExpensesUsd] = useState(0);
  const [installationFeeUsd, setInstallationFeeUsd] = useState(0);
  const [totalReceivedUsd, setTotalReceivedUsd] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [notes, setNotes] = useState("");

  // Device & Material quantities
  const [deviceQuantities, setDeviceQuantities] = useState<Record<string, number>>({});
  const [materialQuantities, setMaterialQuantities] = useState<Record<string, number>>({});

  // Settlement form
  const [moneyReturnedUsd, setMoneyReturnedUsd] = useState(0);
  const [employeeSalaryUsd, setEmployeeSalaryUsd] = useState(0);

  // Sync form state when data loads
  useEffect(() => {
    if (!installation) return;
    setContractNumber(installation.contract_number || "");
    setInstallationDate(
      installation.installation_date
        ? installation.installation_date.slice(0, 10)
        : ""
    );
    setPaymentType(installation.payment_type || "purchased");
    setMonthlyPaymentUsd(installation.monthly_payment_usd || 0);
    setTravelExpenseUsd(installation.travel_expense_usd || 0);
    setAdditionalExpensesUsd(installation.additional_expenses_usd || 0);
    setInstallationFeeUsd(installation.installation_fee_usd || 0);
    setTotalReceivedUsd(installation.total_received_usd || 0);
    setExchangeRate(installation.exchange_rate || 0);
    setNotes(installation.notes || "");
  }, [installation]);

  // Sync device quantities
  useEffect(() => {
    if (!installationDevices) return;
    const map: Record<string, number> = {};
    for (const d of installationDevices) {
      map[d.device_type] = d.quantity;
    }
    setDeviceQuantities(map);
  }, [installationDevices]);

  // Sync material quantities
  useEffect(() => {
    if (!installationMaterials) return;
    const map: Record<string, number> = {};
    for (const m of installationMaterials) {
      map[m.material_type] = m.quantity_used;
    }
    setMaterialQuantities(map);
  }, [installationMaterials]);

  const [saving, setSaving] = useState(false);

  async function handleSave(newStatus?: "submitted" | "accepted") {
    if (!id) return;
    setSaving(true);
    try {
      await updateInstallation.mutateAsync({
        id,
        contract_number: contractNumber,
        installation_date: installationDate,
        payment_type: paymentType,
        monthly_payment_usd: monthlyPaymentUsd,
        travel_expense_usd: travelExpenseUsd,
        additional_expenses_usd: additionalExpensesUsd,
        installation_fee_usd: installationFeeUsd,
        total_received_usd: totalReceivedUsd,
        exchange_rate: exchangeRate,
        notes,
        ...(newStatus ? { status: newStatus } : {}),
        ...(newStatus === "submitted" ? { submitted_by: user!.id } : {}),
        ...(newStatus === "accepted" ? { accepted_by: user!.id } : {}),
      });

      await saveDevices.mutateAsync({
        installationId: id,
        devices: Object.entries(deviceQuantities).map(([device_type, quantity]) => ({
          device_type,
          quantity,
        })),
      });

      await saveMaterials.mutateAsync({
        installationId: id,
        employeeId: installation!.installer_employee,
        materials: Object.entries(materialQuantities).map(
          ([material_type, quantity_used]) => ({
            material_type,
            quantity_used,
          })
        ),
      });

      toast.success(
        newStatus === "submitted"
          ? "Forma topshirildi"
          : newStatus === "accepted"
            ? "Forma qabul qilindi"
            : "Saqlandi"
      );
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleSettlement() {
    if (!id || !user) return;
    try {
      await createSettlement.mutateAsync({
        installation: id,
        money_returned_usd: moneyReturnedUsd,
        employee_salary_usd: employeeSalaryUsd,
        settled_by: user.id,
      });
      await updateInstallation.mutateAsync({
        id,
        status: "accepted",
        accepted_by: user.id,
      });
      toast.success("Hisob-kitob saqlandi va forma qabul qilindi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Yuklanmoqda...</p>;
  }

  if (!installation) {
    return <p>O&apos;rnatish formasi topilmadi</p>;
  }

  const client = installation.expand?.client;
  const installer = installation.expand?.installer_employee;
  const status = installation.status;
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header */}
      <div className="flex items-center gap-4">
        <Link href="/installations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">
            {client?.name || "O'rnatish formasi"}
          </h1>
        </div>
        <Badge variant={statusVariants[status] || "secondary"}>
          {statusLabels[status] || status}
        </Badge>
      </div>

      {/* 2. Mijoz ma'lumotlari */}
      <Card>
        <CardHeader>
          <CardTitle>Mijoz ma&apos;lumotlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {client && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">FIO</Label>
                <p className="text-sm font-medium">
                  {client.contact_person || "\u2014"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Kafe nomi
                </Label>
                <p className="text-sm font-medium">{client.name || "\u2014"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Manzil</Label>
                <p className="text-sm font-medium">
                  {client.address || "\u2014"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Telefon</Label>
                <p className="text-sm font-medium">
                  {client.phone || "\u2014"}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>O&apos;rnatuvchi vakili</Label>
            <Input value={installer?.name || "\u2014"} disabled />
          </div>

          <div className="space-y-2">
            <Label>Shartnoma raqami</Label>
            <Input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="Shartnoma raqamini kiriting"
            />
          </div>

          <div className="space-y-2">
            <Label>O&apos;rnatilgan sana</Label>
            <Input
              type="date"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Devicelar */}
      <Card>
        <CardHeader>
          <CardTitle>Devicelar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deviceTypes?.map((dt) => (
            <div key={dt.id} className="flex items-center justify-between gap-4">
              <Label className="flex-1 text-sm">{dt.name}</Label>
              <Input
                type="number"
                min={0}
                className="w-24"
                value={deviceQuantities[dt.id] || 0}
                onChange={(e) =>
                  setDeviceQuantities((prev) => ({
                    ...prev,
                    [dt.id]: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          ))}
          {(!deviceTypes || deviceTypes.length === 0) && (
            <p className="text-muted-foreground text-sm">
              Device turlari topilmadi
            </p>
          )}
        </CardContent>
      </Card>

      {/* 4. Materiallar */}
      <Card>
        <CardHeader>
          <CardTitle>Materiallar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {materialTypes?.map((mt) => (
            <div key={mt.id} className="flex items-center justify-between gap-4">
              <Label className="flex-1 text-sm">
                {mt.name}
                <span className="text-muted-foreground ml-1">
                  ({unitLabels[mt.unit] || mt.unit})
                </span>
              </Label>
              <Input
                type="number"
                min={0}
                step="any"
                className="w-24"
                value={materialQuantities[mt.id] || 0}
                onChange={(e) =>
                  setMaterialQuantities((prev) => ({
                    ...prev,
                    [mt.id]: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          ))}
          {(!materialTypes || materialTypes.length === 0) && (
            <p className="text-muted-foreground text-sm">
              Material turlari topilmadi
            </p>
          )}
        </CardContent>
      </Card>

      {/* 5. Moliyaviy ma'lumotlar */}
      <Card>
        <CardHeader>
          <CardTitle>Moliyaviy ma&apos;lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dollar kursi</Label>
            <Input
              type="number"
              step="any"
              value={exchangeRate || ""}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              placeholder="Masalan: 12500"
            />
          </div>

          <div className="space-y-2">
            <Label>Yo&apos;l xarajati ($)</Label>
            <Input
              type="number"
              step="any"
              value={travelExpenseUsd || ""}
              onChange={(e) =>
                setTravelExpenseUsd(parseFloat(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground">
              = {usdToUzs(travelExpenseUsd, exchangeRate)} so&apos;m
            </p>
          </div>

          <div className="space-y-2">
            <Label>Qo&apos;shimcha xarajatlar ($)</Label>
            <Input
              type="number"
              step="any"
              value={additionalExpensesUsd || ""}
              onChange={(e) =>
                setAdditionalExpensesUsd(parseFloat(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground">
              = {usdToUzs(additionalExpensesUsd, exchangeRate)} so&apos;m
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ustanovka uchun olingan summa ($)</Label>
            <Input
              type="number"
              step="any"
              value={installationFeeUsd || ""}
              onChange={(e) =>
                setInstallationFeeUsd(parseFloat(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground">
              = {usdToUzs(installationFeeUsd, exchangeRate)} so&apos;m
            </p>
          </div>

          <div className="space-y-2">
            <Label>Klientdan olingan umumiy summa ($)</Label>
            <Input
              type="number"
              step="any"
              value={totalReceivedUsd || ""}
              onChange={(e) =>
                setTotalReceivedUsd(parseFloat(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground">
              = {usdToUzs(totalReceivedUsd, exchangeRate)} so&apos;m
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. To'lov turi */}
      <Card>
        <CardHeader>
          <CardTitle>To&apos;lov turi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={paymentType}
            onValueChange={(v) => setPaymentType(v as PaymentType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchased">Sotib olingan</SelectItem>
              <SelectItem value="rented">Arenda</SelectItem>
            </SelectContent>
          </Select>

          {paymentType === "rented" && (
            <div className="space-y-2">
              <Label>Oylik to&apos;lov summasi ($)</Label>
              <Input
                type="number"
                step="any"
                value={monthlyPaymentUsd || ""}
                onChange={(e) =>
                  setMonthlyPaymentUsd(parseFloat(e.target.value) || 0)
                }
              />
              <p className="text-xs text-muted-foreground">
                = {usdToUzs(monthlyPaymentUsd, exchangeRate)} so&apos;m
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Qo'shimcha */}
      <Card>
        <CardHeader>
          <CardTitle>Qo&apos;shimcha</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Izoh yozing..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* 8. Settlement — admin only, submitted or accepted */}
      {isAdmin && (status === "submitted" || status === "accepted") && (
        <Card>
          <CardHeader>
            <CardTitle>Hisob-kitob</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settlement ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Qaytarilgan pul ($)
                  </span>
                  <span className="font-mono">
                    {settlement.money_returned_usd}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Xodim maoshi ($)
                  </span>
                  <span className="font-mono">
                    {settlement.employee_salary_usd}
                  </span>
                </div>
                {settlement.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Izoh: </span>
                    {settlement.notes}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Qaytarilgan pul ($)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={moneyReturnedUsd || ""}
                    onChange={(e) =>
                      setMoneyReturnedUsd(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Xodim maoshi ($)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={employeeSalaryUsd || ""}
                    onChange={(e) =>
                      setEmployeeSalaryUsd(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <Button onClick={handleSettlement} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Qabul qilish
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 9. Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3 z-50">
        <Button
          onClick={() => handleSave()}
          disabled={saving}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Saqlash
        </Button>

        {status === "draft" && (
          <Button
            onClick={() => handleSave("submitted")}
            disabled={saving}
            variant="secondary"
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            Topshirish
          </Button>
        )}

        {isAdmin && status === "submitted" && (
          <Button
            onClick={() => handleSave("accepted")}
            disabled={saving}
            variant="default"
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Qabul qilish
          </Button>
        )}
      </div>
    </div>
  );
}
