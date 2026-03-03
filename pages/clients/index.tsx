import { useState } from "react";
import Link from "next/link";
import { useClients, useCreateClient, useUpdateClient } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  function openCreate() {
    setEditing(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setAddress("");
    setNotes("");
    setDialogOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setName(c.name);
    setContactPerson(c.contact_person);
    setPhone(c.phone);
    setAddress(c.address);
    setNotes(c.notes);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!name.trim()) return;

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name,
          contact_person: contactPerson,
          phone,
          address,
          notes,
        });
        toast.success("Mijoz yangilandi");
      } else {
        await createMutation.mutateAsync({
          name,
          contact_person: contactPerson,
          phone,
          address,
          notes,
        });
        toast.success("Mijoz qo'shildi");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleDeactivate(c: Client) {
    try {
      await updateMutation.mutateAsync({ id: c.id, is_active: false });
      toast.success(`"${c.name}" o'chirildi`);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  const filtered = clients?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mijozlar</h1>
          <p className="text-muted-foreground">Restoranlar va boshqa mijozlar</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yangi mijoz
        </Button>
      </div>

      <Input
        placeholder="Qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomi</TableHead>
            <TableHead>Aloqa shaxsi</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Manzil</TableHead>
            <TableHead className="w-[120px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Mijozlar topilmadi
              </TableCell>
            </TableRow>
          )}
          {filtered?.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.contact_person || "-"}</TableCell>
              <TableCell>{c.phone || "-"}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {c.address || "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Link href={`/clients/${c.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeactivate(c)}
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
              {editing ? "Mijozni tahrirlash" : "Yangi mijoz"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomi *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Aloqa shaxsi</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Izohlar</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={!name.trim()}
            >
              {editing ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
