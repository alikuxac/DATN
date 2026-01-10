"use client";

import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserNav } from "./UserNav";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
// Since I installed @radix-ui/react-avatar, I can use it but I need to wrapper. 
// I'll just use simple div for now to save tokens or if I have tokens I'd create ui/avatar.tsx.
// I'll use a simple placeholder.

import { useLanguage } from "@/contexts/LanguageContext";

export function Header() {
  const { t } = useLanguage();
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs could go here */}
        <h1 className="text-lg font-semibold">{t("COMMON.HOME")}</h1>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationCenter />
        <UserNav />
      </div>
    </header>
  );
}
