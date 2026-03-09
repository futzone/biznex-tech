import { useState } from "react";
import Link from "next/link";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
} from "@/hooks/useEmployees";
import { useAllEmployeeStock } from "@/hooks/useEmployeeStock";
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
import { Plus, Eye, Pencil, UserX, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Menejer",
  employee: "Xodim",
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "admin" || user?.role === "manager";

  const { data: employees, isLoading } = useEmployees();
  const { data: allStock } = useAllEmployeeStock();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "employee">("employee");
  const [phone, setPhone] = useState("");

  // Password change
  const [newPassword, setNewPassword] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("employee");
    setPhone("");
    setNewPassword("");
    setEditing(null);
  }

  function openEdit(emp: User) {
    setEditing(emp);
    setName(emp.name);
    setPhone(emp.phone || "");
    setRole(emp.role);
    setEditOpen(true);
  }

  function openPasswordChange(emp: User) {
    setEditing(emp);
    setNewPassword("");
    setPasswordOpen(true);
  }

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !password.trim()) return;

    try {
      await createMutation.mutateAsync({ name, email, password, role, phone });
      toast.success(`"${name}" xodim qo'shildi`);
      setCreateOpen(false);
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.email?.message || err?.response?.data?.password?.message || "Xatolik yuz berdi";
      toast.error(msg);
    }
  }

  async function handleEdit() {
    if (!editing || !name.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id: editing.id,
        name,
        phone,
        role,
      });
      toast.success("Xodim yangilandi");
      setEditOpen(false);
      resetForm();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handlePasswordChange() {
    if (!editing || !newPassword.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id: editing.id,
        password: newPassword,
        passwordConfirm: newPassword,
      });
      toast.success("Parol o'zgartirildi");
      setPasswordOpen(false);
      resetForm();
    } catch {
      toast.error("Xatolik yuz berdi. Parol kamida 8 ta belgidan iborat bo'lishi kerak.");
    }
  }

  async function handleDeactivate(emp: User) {
    try {
      await updateMutation.mutateAsync({ id: emp.id, is_active: false });
      toast.success(`"${emp.name}" o'chirildi`);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  function getEmployeeDeviceCount(empId: string) {
    return (
      allStock
        ?.filter((s) => s.employee === empId)
        .reduce((sum, s) => sum + s.quantity, 0) ?? 0
    );
  }

  function getEmployeeDevices(empId: string) {
    return allStock
      ?.filter((s) => s.employee === empId && s.quantity > 0)
      .map((s) => `${s.expand?.device_type?.name}: ${s.quantity}`)
      .join(", ");
  }

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xodimlar</h1>
          <p className="text-muted-foreground">
            Xodimlar ro'yxati va ular qo'lidagi devicelar
          </p>
        </div>
        {isManager && (
          <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi xodim
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ism</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Roli</TableHead>
            <TableHead>Qo'lidagi devicelar</TableHead>
            <TableHead className="text-right">Jami</TableHead>
            {isManager && <TableHead className="w-[140px]">Amallar</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={isManager ? 7 : 6}
                className="text-center text-muted-foreground"
              >
                Xodimlar topilmadi
              </TableCell>
            </TableRow>
          )}
          {employees?.map((emp) => (
            <TableRow key={emp.id}>
              <TableCell className="font-medium">{emp.name || "-"}</TableCell>
              <TableCell>{emp.email}</TableCell>
              <TableCell>{emp.phone || "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {roleLabels[emp.role] || emp.role || "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                {getEmployeeDevices(emp.id) || "-"}
              </TableCell>
              <TableCell className="text-right font-mono">
                {getEmployeeDeviceCount(emp.id)}
              </TableCell>
              {isManager && (
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/employees/${emp.id}`}>
                      <Button variant="ghost" size="icon" title="Ko'rish">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Tahrirlash"
                      onClick={() => openEdit(emp)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Parolni o'zgartirish"
                      onClick={() => openPasswordChange(emp)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {isAdmin && emp.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="O'chirish"
                        onClick={() => handleDeactivate(emp)}
                      >
                        <UserX className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create Employee Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi xodim qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ism *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="To'liq ism"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="xodim@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Parol * (kamida 8 belgi)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parol"
              />
            </div>
            <div className="space-y-2">
              <Label>Roli *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Xodim</SelectItem>
                  <SelectItem value="manager">Menejer</SelectItem>
                  {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
              />
            </div>
            <Button
              onClick={handleCreate}
              className="w-full"
              disabled={!name.trim() || !email.trim() || !password.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Yaratilmoqda..." : "Xodim qo'shish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xodimni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ism *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Roli</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Xodim</SelectItem>
                  <SelectItem value="manager">Menejer</SelectItem>
                  {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button
              onClick={handleEdit}
              className="w-full"
              disabled={!name.trim() || updateMutation.isPending}
            >
              Saqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Parolni o'zgartirish: {editing?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Yangi parol * (kamida 8 belgi)</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yangi parol"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              className="w-full"
              disabled={!newPassword.trim() || newPassword.length < 8 || updateMutation.isPending}
            >
              Parolni o'zgartirish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
