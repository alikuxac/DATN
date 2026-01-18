"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Eye, UserCircle, Plus, Pencil, Ban, CheckCircle, Key, Trash2, Undo, LogOut } from "lucide-react"; // Added Key, Trash2, Undo, LogOut

import { useUsers } from "@/hooks/useUsers";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth"; // Added useAuth
import { UserListResponse, UserRole, UserStatus } from "@/types";
import { cn } from "@/lib/utils";
import { ENUM_USER_ROLE } from "@repo/shared";
import { useLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserDialog } from "./user-dialog";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const currentUserRole = currentUser?.data?.role as UserRole || UserRole.USER;
  const { t } = useLanguage();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const debouncedSearch = useDebounce(q, 500);
  const [role, setRole] = useState<UserRole | "ALL">("ALL");
  const [status, setStatus] = useState<UserStatus | "ALL" | "DELETED">("ALL");
  
  const [selectedUser, setSelectedUser] = useState<UserListResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListResponse | null>(null);

  const { users, metadata, isLoading, updateUserStatus, isUpdatingStatus, resetUserPassword, isResettingPassword, deleteUser, isDeleting, restoreUser, isRestoring, revokeAllUserSessions, isRevokingAll } = useUsers({
    page,
    limit: 10,
    q: debouncedSearch,
    role: role === "ALL" ? undefined : role,
    status: status === "ALL" ? undefined : status,
  });

  const openDetail = (user: UserListResponse) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const handleEdit = (user: UserListResponse) => {
    setEditingUser(user);
    setEditOpen(true);
  };

  const ROLE_LEVELS = {
    [UserRole.SUPER_ADMIN]: 3,
    [UserRole.ADMIN]: 2,
    [UserRole.VOLUNTEER]: 1,
    [UserRole.USER]: 0,
  };

  const checkPermission = (targetUser: UserListResponse, action: 'status' | 'reset_password' | 'edit') => {
      // 1. Prevent action on self
      if (currentUser?.data?._id === targetUser._id) return false;

      const currentLevel = ROLE_LEVELS[currentUserRole];
      const targetLevel = ROLE_LEVELS[targetUser.role as UserRole] || 0;

      // 2. Prevent action on users with higher or equal role
      if (targetLevel >= currentLevel) return false;

      return true;
  };

  const handleStatusChange = (user: UserListResponse) => {
    if (!checkPermission(user, 'status')) return;
    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    updateUserStatus({ id: user._id, status: newStatus });
  };

  const handleResetPassword = (user: UserListResponse) => {
      if (!checkPermission(user, 'reset_password')) return;
      if (confirm(t("USERS.DIALOG.CONFIRM_RESET_PASSWORD", { email: user.email }))) {
          resetUserPassword(user._id);
      }
  };

  const handleDelete = (user: UserListResponse) => {
    if (!checkPermission(user, 'status')) return; // Reusing status permission for delete for now, or assume admin can delete
    if (confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      deleteUser(user._id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("USERS.TITLE")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("USERS.CREATE")}
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder={t("USERS.SEARCH_PLACEHOLDER")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[300px]"
          />
          <Select
            value={role}
            onValueChange={(val) => setRole(val as UserRole | "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("USERS.ROLE_PLACEHOLDER")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("USERS.ALL_ROLES")}</SelectItem>
              <SelectItem value="Super Admin">Super Admin</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Volunteer">Volunteer</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as UserStatus | "ALL" | "DELETED")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("USERS.STATUS_PLACEHOLDER")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("USERS.ALL_STATUSES")}</SelectItem>
              <SelectItem value="ACTIVE">{t("USERS.DIALOG.ON")}</SelectItem>
              <SelectItem value="INACTIVE">{t("USERS.DIALOG.OFF")}</SelectItem>
              <SelectItem value="DELETED">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("USERS.DIALOG.FIRST_NAME")}</TableHead>
              <TableHead>{t("USERS.DIALOG.EMAIL")}</TableHead>
              <TableHead>{t("USERS.DIALOG.ROLE")}</TableHead>
              <TableHead>{t("USERS.DIALOG.STATUS")}</TableHead>
              <TableHead>{t("USERS.DIALOG.CREATED_AT")}</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t("USERS.NO_RESULTS")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                        user.role === UserRole.SUPER_ADMIN && "bg-purple-50 text-purple-700 ring-purple-600/20",
                        user.role === UserRole.ADMIN && "bg-blue-50 text-blue-700 ring-blue-700/10",
                        user.role === UserRole.VOLUNTEER && "bg-orange-50 text-orange-700 ring-orange-600/20",
                        user.role === UserRole.USER && "bg-gray-50 text-gray-600 ring-gray-500/10"
                      )}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                        user.status === UserStatus.ACTIVE && "bg-green-50 text-green-700 ring-green-600/20",
                        user.status === UserStatus.INACTIVE && "bg-red-50 text-red-700 ring-red-600/10"
                      )}
                    >
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), "PP p")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDetail(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {checkPermission(user, 'edit') && (
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                      )}
                      {checkPermission(user, 'reset_password') && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleResetPassword(user)}
                            disabled={isResettingPassword}
                            title="Reset Password"
                          >
                              <Key className="h-4 w-4" />
                          </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleStatusChange(user)}
                        disabled={isUpdatingStatus || !checkPermission(user, 'status')}
                        className={user.status === UserStatus.ACTIVE ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}
                      >
                         {user.status === UserStatus.ACTIVE ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      
                      {checkPermission(user, 'status') && (
                        (user as any).deleted ? (
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Are you sure you want to restore user ${user.email}?`)) {
                                restoreUser(user._id);
                              }
                            }}
                            disabled={isRestoring}
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            title="Restore User"
                          >
                             <Undo className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete User"
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1 || isLoading}
        >
          {t("USERS.PAGINATION.PREVIOUS")}
        </Button>
        <span className="text-sm">
          {t("USERS.PAGINATION.PAGE_OF", { page: String(page), total: String(metadata?.totalPage || 1) })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((old) => (metadata && page < metadata.totalPage ? old + 1 : old))}
          disabled={!metadata || page >= metadata.totalPage || isLoading}
        >
          {t("USERS.PAGINATION.NEXT")}
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("USERS.DIALOG.TITLE")}</DialogTitle>
            <DialogDescription>ID: {selectedUser?._id}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.FIRST_NAME")}</h4>
                  <p className="text-foreground font-medium">{selectedUser.firstName}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.LAST_NAME")}</h4>
                  <p className="text-foreground font-medium">{selectedUser.lastName}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.EMAIL")}</h4>
                  <p className="text-foreground font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.ROLE")}</h4>
                  <p className="text-foreground font-medium">{selectedUser.role}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.STATUS")}</h4>
                  <p className="text-foreground font-medium">{selectedUser.status}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.RESCUE_MODE")}</h4>
                  <p className="text-foreground font-medium">{selectedUser.isRescueMode ? t("USERS.DIALOG.YES") : t("USERS.DIALOG.NO")}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.PREFERENCES")}</h4>
                  <p className="text-foreground font-medium">Language: {selectedUser.preferences.language}, Theme: {selectedUser.preferences.theme}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.SETTINGS")}</h4>
                  <p className="text-foreground font-medium">
                    Push: {selectedUser.settings.pushEnabled ? t("USERS.DIALOG.ON") : t("USERS.DIALOG.OFF")}, 
                    SOS Alerts: {selectedUser.settings.sosAlerts ? t("USERS.DIALOG.ON") : t("USERS.DIALOG.OFF")}, 
                    Activity Updates: {selectedUser.settings.activityUpdates ? t("USERS.DIALOG.ON") : t("USERS.DIALOG.OFF")}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.CREATED_AT")}</h4>
                  <p className="text-foreground font-medium">{format(new Date(selectedUser.createdAt), "PPpp")}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("USERS.DIALOG.UPDATED_AT")}</h4>
                  <p className="text-foreground font-medium">{format(new Date(selectedUser.updatedAt), "PPpp")}</p>
                </div>
              </div>

              {currentUserRole === UserRole.SUPER_ADMIN || currentUserRole === UserRole.ADMIN ? (
                 <div className="flex justify-end pt-4 border-t mt-2">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        if (confirm(`Are you sure you want to revoke ALL sessions for ${selectedUser.email}? They will be logged out from all devices.`)) {
                          revokeAllUserSessions(selectedUser._id);
                        }
                      }}
                      disabled={isRevokingAll}
                    >
                      {isRevokingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                      Revoke All Sessions
                    </Button>
                 </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <UserDialog open={createOpen} onOpenChange={setCreateOpen} currentUserRole={currentUserRole} />
      <UserDialog open={editOpen} onOpenChange={setEditOpen} user={editingUser} currentUserRole={currentUserRole} />
    </div>
  );
}
