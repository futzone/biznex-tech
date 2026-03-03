import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useAssignments,
  useCreateAssignment,
  useUpdateAssignment,
} from "@/hooks/useAssignments";
import { useEmployees } from "@/hooks/useEmployees";
import { useClients } from "@/hooks/useClients";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { AssignmentStatus } from "@/lib/types";

const statusLabels: Record<AssignmentStatus, string> = {
  assigned: "Biriktirilgan",
  in_progress: "Jarayonda",
  completed: "Tugatilgan",
  cancelled: "Bekor qilingan",
};

const statusColors: Record<AssignmentStatus, "default" | "secondary" | "outline" | "destructive"> = {
  assigned: "outline",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function AssignmentsPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const isManager = user?.role === "admin" || user?.role === "manager";

  const { data: assignments, isLoading } = useAssignments(
    isEmployee ? { employeeId: user?.id } : undefined
  );
  const { data: employees } = useEmployees();
  const { data: clients } = useClients();
  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [assignedDate, setAssignedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  async function handleCreate() {
    if (!selectedEmployee || !selectedClient) return;

    try {
      await createMutation.mutateAsync({
        employee: selectedEmployee,
        client: selectedClient,
        assigned_date: assignedDate,
        notes,
      });
      toast.success("Topshiriq yaratildi");
      setCreateOpen(false);
      setSelectedEmployee("");
      setSelectedClient("");
      setNotes("");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  async function handleStatusChange(id: string, status: AssignmentStatus) {
    try {
      await updateMutation.mutateAsync({
        id,
        status,
        completed_date:
          status === "completed" ? new Date().toISOString() : undefined,
      });
      toast.success("Holat yangilandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Topshiriqlar</h1>
          <p className="text-muted-foreground">
            Xodim-mijoz biriktirmalari
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi topshiriq
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Xodim</TableHead>
            <TableHead>Mijoz</TableHead>
            <TableHead>Sana</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead>Izoh</TableHead>
            {isManager && <TableHead>Amallar</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Topshiriqlar topilmadi
              </TableCell>
            </TableRow>
          )}
          {assignments?.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">
                {a.expand?.employee?.name || "-"}
              </TableCell>
              <TableCell>{a.expand?.client?.name || "-"}</TableCell>
              <TableCell>
                {format(new Date(a.assigned_date), "dd.MM.yyyy")}
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[a.status]}>
                  {statusLabels[a.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {a.notes || "-"}
              </TableCell>
              {isManager && (
              <TableCell>
                <Select
                  value={a.status}
                  onValueChange={(v) =>
                    handleStatusChange(a.id, v as AssignmentStatus)
                  }
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi topshiriq</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Xodim *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name || e.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mijoz *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sana</Label>
              <Input
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Izoh</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button
              onClick={handleCreate}
              className="w-full"
              disabled={!selectedEmployee || !selectedClient}
            >
              Yaratish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
