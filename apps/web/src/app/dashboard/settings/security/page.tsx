"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Monitor, Smartphone, Globe, LogOut } from "lucide-react";

import { SessionData, useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button"; // id: 6
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useLanguage } from "@/contexts/LanguageContext";

export default function SecurityPage() {
  const [page, setPage] = useState(1);
  const { t } = useLanguage();
  const { sessions, metadata, isLoading, revokeSession, isRevoking } = useSession({
    page,
    limit: 20,
  });

  const getDeviceIcon = (session: SessionData) => {
    const platform = session.platform?.toUpperCase();

    if (platform === "MOBILE") return <Smartphone className="h-4 w-4" />;
    
    if (platform === "WEB") return <Monitor className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  const formatSafeDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    try {
      return format(date, "PP p");
    } catch {
      return "N/A";
    }
  };

  const handleRevoke = (id: string) => {
    if (confirm("Are you sure you want to revoke this session?")) {
      revokeSession(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("SECURITY.TITLE")}</h1>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("SECURITY.TABLE_DEVICE")}</TableHead>
              <TableHead>{t("SECURITY.TABLE_LOCATION")}</TableHead>
              <TableHead>{t("SECURITY.TABLE_LAST_ACTIVE")}</TableHead>
              <TableHead>{t("SECURITY.TABLE_STATUS")}</TableHead>
              <TableHead>{t("SECURITY.TABLE_ACTION")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("SECURITY.NO_SESSIONS")}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session)}
                      <div className="flex flex-col">
                        <span className="font-medium">{session.deviceName || "Unknown Device"}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                             <span>{session.os && session.os !== "Unknown" ? session.os : (session.platform || "Unknown Platform")}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{session.ip || "Unknown IP"}</TableCell>
                  <TableCell>
                    {session.isCurrent ? (
                      <span className="text-green-600 font-medium">{t("SECURITY.STATUS_ONLINE")}</span>
                    ) : (
                      formatSafeDate(session.lastActiveAt)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.isCurrent ? "default" : "secondary"}>
                      {session.isCurrent ? t("SECURITY.STATUS_ONLINE") : t("SECURITY.STATUS_ACTIVE")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(session._id)}
                        disabled={isRevoking}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t("SECURITY.ACTION_REVOKE")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
             {t("USERS.PAGINATION.PAGE_OF", { page: String(page), total: String(metadata?.totalPage || 1) })}
        </div>
        <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
            >
              {t("USERS.PAGINATION.PREVIOUS")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= (metadata?.totalPage ?? 1) || isLoading}
            >
              {t("USERS.PAGINATION.NEXT")}
            </Button>
        </div>
      </div>
    </div>
  );
}
