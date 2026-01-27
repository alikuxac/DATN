"use client";

import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SystemSettingsPage() {
    const { t } = useLanguage();
    const { cleanUpExpiredSessions, isCleaningUp } = useUsers({ page: 1, limit: 1 });
    const { user } = useAuth();
    const currentUserRole = user?.data?.role;

    if (currentUserRole !== UserRole.SUPER_ADMIN && currentUserRole !== UserRole.ADMIN) {
        return <div className="p-6">You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">{t("SYSTEM.TITLE")}</h1>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                         <Trash2 className="h-5 w-5" />
                         {t("SYSTEM.SESSION_MANAGEMENT")}
                    </CardTitle>
                    <CardDescription>
                        {t("SYSTEM.SESSION_DESC")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t("SYSTEM.WARNING_TITLE")}</AlertTitle>
                        <AlertDescription dangerouslySetInnerHTML={{ __html: t("SYSTEM.WARNING_DESC") }} />
                    </Alert>

                    <Button 
                        variant="destructive" 
                        onClick={() => {
                            if (confirm(t("SYSTEM.CONFIRM_CLEANUP"))) {
                                cleanUpExpiredSessions();
                            }
                        }}
                        disabled={isCleaningUp}
                    >
                        {isCleaningUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        {t("SYSTEM.BTN_CLEANUP")}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
