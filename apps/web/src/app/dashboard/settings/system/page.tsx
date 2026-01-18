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

export default function SystemSettingsPage() {
    const { cleanUpExpiredSessions, isCleaningUp } = useUsers({ page: 1, limit: 1 });
    const { user } = useAuth();
    const currentUserRole = user?.data?.role;

    if (currentUserRole !== UserRole.SUPER_ADMIN && currentUserRole !== UserRole.ADMIN) {
        return <div className="p-6">You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                         <Trash2 className="h-5 w-5" />
                         Session Management
                    </CardTitle>
                    <CardDescription>
                        Manage global session states.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            This action will expire sessions for <strong>ALL users</strong>, including Admins. 
                            Users with expired sessions (based on the system cleanup policy) will be logged out immediately. 
                            You might need to log in again if your session is expired.
                        </AlertDescription>
                    </Alert>

                    <Button 
                        variant="destructive" 
                        onClick={() => {
                            if (confirm("Warning: This action will expire sessions for ALL users, including Admins. You might need to log in again. Are you sure?")) {
                                cleanUpExpiredSessions();
                            }
                        }}
                        disabled={isCleaningUp}
                    >
                        {isCleaningUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Clean Up Expired Sessions
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
