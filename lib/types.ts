import type { RecordModel } from "pocketbase";

export interface User extends RecordModel {
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "manager" | "employee";
  phone: string;
  is_active: boolean;
}

export interface DeviceType extends RecordModel {
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

export interface Supplier extends RecordModel {
  name: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export interface Client extends RecordModel {
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  notes: string;
  is_active: boolean;
}

export interface WarehouseStock extends RecordModel {
  device_type: string;
  quantity: number;
  expand?: {
    device_type?: DeviceType;
  };
}

export interface EmployeeStock extends RecordModel {
  employee: string;
  device_type: string;
  quantity: number;
  expand?: {
    employee?: User;
    device_type?: DeviceType;
  };
}

export interface ClientStock extends RecordModel {
  client: string;
  device_type: string;
  quantity: number;
  expand?: {
    client?: Client;
    device_type?: DeviceType;
  };
}

export type TransactionType =
  | "warehouse_to_employee"
  | "employee_to_client"
  | "client_to_employee"
  | "employee_to_warehouse"
  | "adjustment";

export interface Transaction extends RecordModel {
  type: TransactionType;
  device_type: string;
  quantity: number;
  from_employee: string;
  to_employee: string;
  client: string;
  supplier: string;
  serial_numbers: string;
  notes: string;
  performed_by: string;
  expand?: {
    device_type?: DeviceType;
    from_employee?: User;
    to_employee?: User;
    client?: Client;
    supplier?: Supplier;
    performed_by?: User;
  };
}

export type AssignmentStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Assignment extends RecordModel {
  employee: string;
  client: string;
  status: AssignmentStatus;
  assigned_date: string;
  completed_date: string;
  notes: string;
  expand?: {
    employee?: User;
    client?: Client;
  };
}

export type ExpenseStatus = "pending" | "approved" | "rejected";

export interface Expense extends RecordModel {
  employee: string;
  assignment: string;
  client: string;
  category: string;
  amount: number;
  description: string;
  receipt: string;
  date: string;
  status: ExpenseStatus;
  approved_by: string;
  expand?: {
    employee?: User;
    assignment?: Assignment;
    client?: Client;
    approved_by?: User;
  };
}
