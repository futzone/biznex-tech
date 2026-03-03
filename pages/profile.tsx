import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUpdateEmployee } from "@/hooks/useEmployees";
import { useEmployeeStock } from "@/hooks/useEmployeeStock";
import { useAssignments } from "@/hooks/useAssignments";
import { useExpenses } from "@/hooks/useExpenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, ClipboardList, Receipt, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Menejer",
  employee: "Xodim",
};

const statusLabels: Record<string, string> = {
  assigned: "Biriktirilgan",
  in_progress: "Jarayonda",
  completed: "Tugatilgan",
  cancelled: "Bekor qilingan",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const updateMutation = useUpdateEmployee();

  const { data: stock } = useEmployeeStock(user?.id);
  const { data: assignments } = useAssignments({ employeeId: user?.id });
  const { data: expenses } = useExpenses({ employeeId: user?.id });

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const totalDevices =
    stock?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
  const activeAssignments =
    assignments?.filter((a) => a.status === "assigned" || a.status === "in_progress").length ?? 0;
  const pendingExpenses =
    expenses?.filter((e) => e.status === "pending").length ?? 0;

  async function handlePasswordChange() {
    if (!newPassword.trim() || newPassword.length < 8) return;

    try {
      await updateMutation.mutateAsync({
        id: user!.id,
        password: newPassword,
        passwordConfirm: newPassword,
      });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPasswordOpen(false);
      setOldPassword("");
      setNewPassword("");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mening profilim</h1>
          <p className="text-muted-foreground">Shaxsiy ma'lumotlar va statistika</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setOldPassword("");
            setNewPassword("");
            setPasswordOpen(true);
          }}
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Parolni o'zgartirish
        </Button>
      </div>

      {/* Profile Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ism</p>
              <p className="font-medium">{user.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefon</p>
              <p className="font-medium">{user.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roli</p>
              <Badge variant="secondary">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Qo'limdagi devicelar</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faol topshiriqlar</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kutilayotgan xarajatlar</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses}</div>
          </CardContent>
        </Card>
      </div>

      {/* Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Qo'limdagi devicelar</CardTitle>
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

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Topshiriqlarim</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments?.length === 0 ? (
            <p className="text-muted-foreground text-sm">Topshiriqlar yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Izoh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments?.slice(0, 10).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.expand?.client?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {statusLabels[a.status] || a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(a.assigned_date), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parolni o'zgartirish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Yangi parol * (kamida 8 belgi)</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yangi parol"
              />
            </div>
            {newPassword && newPassword.length < 8 && (
              <p className="text-sm text-destructive">
                Parol kamida 8 ta belgidan iborat bo'lishi kerak
              </p>
            )}
            <Button
              onClick={handlePasswordChange}
              className="w-full"
              disabled={!newPassword.trim() || newPassword.length < 8}
            >
              O'zgartirish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
