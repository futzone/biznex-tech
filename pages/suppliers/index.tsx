import { useState } from "react";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
} from "@/hooks/useSuppliers";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Supplier } from "@/lib/types";

export default function SuppliersPage() {
  const { data: suppliers, isLoading } = useSuppliers();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  function openCreate() {
    setEditing(null);
    setName("");
    setPhone("");
    setAddress("");
    setDialogOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setName(s.name);
    setPhone(s.phone || "");
    setAddress(s.address || "");
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!name.trim()) return;

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name,
          phone,
          address,
        });
        toast.success("Yetkazib beruvchi yangilandi");
      } else {
        await createMutation.mutateAsync({ name, phone, address });
        toast.success("Yetkazib beruvchi qo'shildi");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleDeactivate(s: Supplier) {
    try {
      await updateMutation.mutateAsync({ id: s.id, is_active: false });
      toast.success(`"${s.name}" o'chirildi`);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yetkazib beruvchilar</h1>
          <p className="text-muted-foreground">
            Device yetkazib beruvchilarni boshqaring
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yangi yetkazib beruvchi
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomi</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Manzil</TableHead>
            <TableHead className="w-[100px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                Yetkazib beruvchilar topilmadi
              </TableCell>
            </TableRow>
          )}
          {suppliers?.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.phone || "-"}</TableCell>
              <TableCell>{s.address || "-"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeactivate(s)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Yetkazib beruvchini tahrirlash"
                : "Yangi yetkazib beruvchi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomi *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kompaniya nomi"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Manzil"
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={
                !name.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editing ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
