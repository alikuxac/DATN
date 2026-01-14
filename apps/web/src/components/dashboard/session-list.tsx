"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Monitor, Smartphone, Globe, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { SessionListResponse as BaseSessionListResponse, SessionStatus, ApiResponse } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Extend the base type to include computed properties from the API DTO
interface SessionListResponse extends BaseSessionListResponse {
    deviceName: string;
    os: string;
    lastActiveAt: Date | string;
    isCurrent: boolean;
}

export function SessionList() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch Sessions
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      // Assuming pagination is not critical for now, fetching first page with reasonable limit
      const { data } = await api.get<{ data: SessionListResponse[] }>("/session/list", {
        params: { limit: 20 },
      });
      return data.data;
    },
  });

  // Revoke Session
  const revokeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/session/revoke/${sessionId}`);
    },
    onSuccess: () => {
      toast.success(t("SESSION.REVOKE_SUCCESS") || "Session revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to revoke session");
    },
  });

  const getDeviceIcon = (os: string) => {
    const osLower = os.toLowerCase();
    if (osLower.includes("android") || osLower.includes("ios")) return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t("SESSION.TITLE") || "Active Sessions"}</CardTitle>
        <CardDescription>
          {t("SESSION.DESC") || "Manage your active sessions and logged-in devices."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Location (IP)</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : data && data.length > 0 ? (
              data.map((session) => (
                <TableRow key={session._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.os)}
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{session.deviceName}</span>
                        <span className="text-xs text-muted-foreground">{session.os}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.ip}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{format(new Date(session.lastActiveAt), "PP")}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(session.lastActiveAt), "p")}</span>
                    </div>
                  </TableCell>
                   <TableCell>
                    {session.isCurrent ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Current</Badge>
                    ) : (
                        <Badge variant="secondary">{session.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!session.isCurrent && session.status === SessionStatus.ACTIVE && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                            if (confirm("Are you sure you want to revoke this session?")) {
                                revokeMutation.mutate(session._id);
                            }
                        }}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        No active sessions found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
