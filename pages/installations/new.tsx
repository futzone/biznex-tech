import { useState } from "react";
import { useRouter } from "next/router";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateInstallation } from "@/hooks/useInstallations";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewInstallationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "manager";

  const { data: clients } = useClients();
  const { data: employees } = useEmployees();
  const createClient = useCreateClient();
  const createInstallation = useCreateInstallation();

  // Select existing client or create new
  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(user?.id || "");

  // New client form
  const [clientName, setClientName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  async function handleCreate() {
    try {
      let clientId = selectedClient;

      // If creating new client
      if (mode === "create") {
        if (!clientName.trim()) {
          toast.error("Kafe nomini kiriting");
          return;
        }
        const newClient = await createClient.mutateAsync({
          name: clientName,
          contact_person: contactPerson,
          phone: clientPhone,
          address: clientAddress,
        });
        clientId = newClient.id;
      }

      if (!clientId) {
        toast.error("Mijozni tanlang");
        return;
      }

      const installation = await createInstallation.mutateAsync({
        client: clientId,
        installer_employee: selectedEmployee || user?.id,
        status: "draft" as const,
      });

      toast.success("O'rnatish formasi yaratildi");
      router.push(`/installations/${installation.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Xatolik yuz berdi");
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/installations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Yangi o'rnatish</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mijoz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("select")}
            >
              Mavjud mijoz
            </Button>
            <Button
              variant={mode === "create" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("create")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Yangi mijoz
            </Button>
          </div>

          {mode === "select" ? (
            <div className="space-y-2">
              <Label>Mijozni tanlang *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.contact_person ? `(${c.contact_person})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Kafe nomi *</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Restoran nomi"
                />
              </div>
              <div className="space-y-2">
                <Label>FIO (aloqa shaxsi)</Label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="To'liq ism"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>Manzil</Label>
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Kafe manzili"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>O'rnatuvchi xodim</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleCreate}
        className="w-full"
        size="lg"
        disabled={
          createInstallation.isPending ||
          createClient.isPending ||
          (mode === "select" && !selectedClient) ||
          (mode === "create" && !clientName.trim())
        }
      >
        {createInstallation.isPending ? "Yaratilmoqda..." : "Formani yaratish"}
      </Button>
    </div>
  );
}
