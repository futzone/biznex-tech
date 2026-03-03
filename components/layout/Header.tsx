import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { LogOut, Menu, User } from "lucide-react";
import { useState } from "react";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Menejer",
  employee: "Xodim",
};

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background">
      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {user && (
          <>
            <Badge variant="secondary">{roleLabels[user.role] || user.role}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {user.name || user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
