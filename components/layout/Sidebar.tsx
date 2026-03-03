import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Warehouse,
  Users,
  Building2,
  ArrowLeftRight,
  Receipt,
  ClipboardList,
  Settings,
  UserCircle,
  Package,
  Truck,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: string[]; // if undefined = all roles can see
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Omborxona",
    href: "/warehouse",
    icon: Warehouse,
    roles: ["admin", "manager"],
  },
  {
    name: "Xodimlar",
    href: "/employees",
    icon: Users,
    roles: ["admin", "manager"],
  },
  {
    name: "Mijozlar",
    href: "/clients",
    icon: Building2,
  },
  {
    name: "Tranzaksiyalar",
    href: "/transactions",
    icon: ArrowLeftRight,
    roles: ["admin", "manager"],
  },
  {
    name: "Topshiriqlar",
    href: "/assignments",
    icon: ClipboardList,
  },
  {
    name: "Xarajatlar",
    href: "/expenses",
    icon: Receipt,
  },
  {
    name: "Yetkazib beruvchilar",
    href: "/suppliers",
    icon: Truck,
    roles: ["admin", "manager"],
  },
  {
    name: "Sozlamalar",
    href: "/settings/device-types",
    icon: Settings,
    roles: ["admin"],
  },
];

const employeeNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mening profilim", href: "/profile", icon: UserCircle },
  { name: "Mening devicelarim", href: "/my-devices", icon: Package },
  { name: "Mijozlar", href: "/clients", icon: Building2 },
  { name: "Topshiriqlar", href: "/assignments", icon: ClipboardList },
  { name: "Xarajatlar", href: "/expenses", icon: Receipt },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const router = useRouter();
  const { user } = useAuth();

  const role = user?.role || "employee";
  const isEmployee = role === "employee";

  const navItems = isEmployee
    ? employeeNavigation
    : navigation.filter(
        (item) => !item.roles || item.roles.includes(role)
      );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold">Biznex</h1>
        <p className="text-xs text-muted-foreground">Inventory Management</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            router.pathname === item.href ||
            router.pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
