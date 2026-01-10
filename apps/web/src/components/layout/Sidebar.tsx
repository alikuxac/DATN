import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Map as MapIcon,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";



export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarItems = [
    {
      title: t("SIDEBAR.HOME"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("SIDEBAR.REPORTS"),
      href: "/dashboard/reports",
      icon: FileText,
    },
    {
      title: t("SIDEBAR.LIVE_MAP"),
      href: "/dashboard/map",
      icon: MapIcon,
    },
    {
      title: t("SIDEBAR.NOTIFICATIONS"),
      href: "/dashboard/notifications",
      icon: Bell,
    },
    {
      title: t("SIDEBAR.USERS"),
      href: "/dashboard/users",
      icon: Users,
    },
  ];

  return (
    <div 
      className={cn(
        "relative flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-20 h-6 w-6 rounded-full border bg-background shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <div className={cn("flex h-16 items-center border-b px-6 overflow-hidden", isCollapsed && "px-2 justify-center")}>
        <span className={cn("text-lg font-bold whitespace-nowrap transition-all", isCollapsed && "opacity-0 hidden")}>
          {t("SIDEBAR.TITLE")}
        </span>
        {isCollapsed && <span className="text-lg font-bold text-primary">AD</span>}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {sidebarItems.map((item, index) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const IconComp = item.icon as any;
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <IconComp className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.title}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
