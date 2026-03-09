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

// ===== Installation System =====

export interface MaterialType extends RecordModel {
  name: string;
  unit: "meter" | "piece" | "roll" | "kg";
  is_active: boolean;
}

export type InstallationStatus = "draft" | "submitted" | "accepted";
export type PaymentType = "purchased" | "rented";

export interface Installation extends RecordModel {
  client: string;
  installer_employee: string;
  contract_number: string;
  installation_date: string;
  payment_type: PaymentType;
  monthly_payment_usd: number;
  travel_expense_usd: number;
  additional_expenses_usd: number;
  installation_fee_usd: number;
  total_received_usd: number;
  exchange_rate: number;
  notes: string;
  status: InstallationStatus;
  submitted_by: string;
  accepted_by: string;
  expand?: {
    client?: Client;
    installer_employee?: User;
    submitted_by?: User;
    accepted_by?: User;
  };
}

export interface InstallationDevice extends RecordModel {
  installation: string;
  device_type: string;
  quantity: number;
  expand?: {
    device_type?: DeviceType;
  };
}

export interface InstallationMaterial extends RecordModel {
  installation: string;
  material_type: string;
  quantity_used: number;
  expand?: {
    material_type?: MaterialType;
  };
}

export interface EmployeeMaterial extends RecordModel {
  employee: string;
  material_type: string;
  quantity: number;
  expand?: {
    employee?: User;
    material_type?: MaterialType;
  };
}

export interface MaterialPurchase extends RecordModel {
  employee: string;
  material_type: string;
  quantity: number;
  cost_usd: number;
  for_client: string;
  date: string;
  notes: string;
  expand?: {
    employee?: User;
    material_type?: MaterialType;
    for_client?: Client;
  };
}

export type CashEntryType =
  | "received_from_client"
  | "spent_on_material"
  | "returned_to_company"
  | "given_by_company";

export interface EmployeeCash extends RecordModel {
  employee: string;
  type: CashEntryType;
  amount_usd: number;
  installation: string;
  description: string;
  date: string;
  recorded_by: string;
  expand?: {
    employee?: User;
    installation?: Installation;
    recorded_by?: User;
  };
}

export interface InstallationSettlement extends RecordModel {
  installation: string;
  money_returned_usd: number;
  employee_salary_usd: number;
  notes: string;
  settled_by: string;
  expand?: {
    installation?: Installation;
    settled_by?: User;
  };
}

export interface MonthlyPayment extends RecordModel {
  installation: string;
  month: string;
  amount_usd: number;
  paid: boolean;
  paid_date: string;
  expand?: {
    installation?: Installation;
  };
}

// ===== Expenses =====

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
