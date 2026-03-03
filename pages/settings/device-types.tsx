import { useState } from "react";
import {
  useDeviceTypes,
  useCreateDeviceType,
  useUpdateDeviceType,
} from "@/hooks/useDeviceTypes";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DeviceType } from "@/lib/types";

export default function DeviceTypesPage() {
  const { data: deviceTypes, isLoading } = useDeviceTypes();
  const createMutation = useCreateDeviceType();
  const updateMutation = useUpdateDeviceType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeviceType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setIcon("");
    setDialogOpen(true);
  }

  function openEdit(dt: DeviceType) {
    setEditing(dt);
    setName(dt.name);
    setDescription(dt.description);
    setIcon(dt.icon);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!name.trim()) return;

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name,
          description,
          icon,
        });
        toast.success("Device turi yangilandi");
      } else {
        await createMutation.mutateAsync({ name, description, icon });
        toast.success("Device turi qo'shildi");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleDeactivate(dt: DeviceType) {
    try {
      await updateMutation.mutateAsync({ id: dt.id, is_active: false });
      toast.success(`"${dt.name}" o'chirildi`);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Device turlari</h1>
          <p className="text-muted-foreground">
            Printer, monoblok, router va boshqa device turlarini boshqaring
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Yangi tur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Device turini tahrirlash" : "Yangi device turi"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nomi *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Thermal Printer"
                />
              </div>
              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Qisqacha tavsif"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon (Lucide icon nomi)</Label>
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="printer, monitor, wifi..."
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomi</TableHead>
            <TableHead>Tavsif</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead className="w-[100px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deviceTypes?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Hech qanday device turi topilmadi
              </TableCell>
            </TableRow>
          )}
          {deviceTypes?.map((dt) => (
            <TableRow key={dt.id}>
              <TableCell className="font-medium">{dt.name}</TableCell>
              <TableCell>{dt.description || "-"}</TableCell>
              <TableCell>
                {dt.icon ? <Badge variant="secondary">{dt.icon}</Badge> : "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(dt)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeactivate(dt)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
