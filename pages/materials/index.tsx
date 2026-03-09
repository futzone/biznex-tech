import { useState } from "react";
import {
  useMaterialTypes,
  useCreateMaterialType,
  useUpdateMaterialType,
} from "@/hooks/useMaterialTypes";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MaterialType } from "@/lib/types";

const unitLabels: Record<string, string> = {
  meter: "Metr",
  piece: "Dona",
  roll: "Rullon",
  kg: "Kg",
};

export default function MaterialsPage() {
  const { data: materials, isLoading } = useMaterialTypes();
  const createMutation = useCreateMaterialType();
  const updateMutation = useUpdateMaterialType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialType | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("piece");

  function openCreate() {
    setEditing(null);
    setName("");
    setUnit("piece");
    setDialogOpen(true);
  }

  function openEdit(m: MaterialType) {
    setEditing(m);
    setName(m.name);
    setUnit(m.unit || "piece");
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, name, unit });
        toast.success("Material yangilandi");
      } else {
        await createMutation.mutateAsync({ name, unit });
        toast.success("Material qo'shildi");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleDeactivate(m: MaterialType) {
    try {
      await updateMutation.mutateAsync({ id: m.id, is_active: false });
      toast.success(`"${m.name}" o'chirildi`);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material turlari</h1>
          <p className="text-muted-foreground">
            Kabel, adapter va boshqa materiallarni boshqaring
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yangi material
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomi</TableHead>
            <TableHead>O'lchov birligi</TableHead>
            <TableHead className="w-[100px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials?.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Material turlari topilmadi
              </TableCell>
            </TableRow>
          )}
          {materials?.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{unitLabels[m.unit] || m.unit}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeactivate(m)}>
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
              {editing ? "Materialni tahrirlash" : "Yangi material turi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomi *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: UTP kabel"
              />
            </div>
            <div className="space-y-2">
              <Label>O'lchov birligi</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meter">Metr</SelectItem>
                  <SelectItem value="piece">Dona</SelectItem>
                  <SelectItem value="roll">Rullon</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
