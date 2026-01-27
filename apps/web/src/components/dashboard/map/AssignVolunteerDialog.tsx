import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiResponse, UserListResponse } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface AssignVolunteerDialogProps {
  reportId: string | null;
  onClose: () => void;
}

export function AssignVolunteerDialog({ reportId, onClose }: AssignVolunteerDialogProps) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);

  // Fetch Volunteers (Idle preferred)
  const { data: volunteers, isLoading } = useQuery({
     queryKey: ['available-volunteers-assign'],
     queryFn: async () => {
         const { data } = await api.get<ApiResponse<UserListResponse[]>>('/admin/user/list', {
             params: { role: 'VOLUNTEER', status: 'ACTIVE', limit: 100 }
         });
         return data.data || [];
     },
     enabled: !!reportId
  });

  const assignMutation = useMutation({
      mutationFn: async () => {
          if (!reportId || !selectedVolunteerId) return;
          await api.post(`/admin/report/${reportId}/assign`, { volunteerId: selectedVolunteerId });
      },
      onSuccess: () => {
          toast.success(t("DISPATCH.SUCCESS"));
          queryClient.invalidateQueries({ queryKey: ['map-reports'] });
          onClose();
      },
      onError: () => {
          toast.error(t("DISPATCH.ERROR"));
      }
  });

  return (
    <Dialog open={!!reportId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{t("DISPATCH.TITLE")}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                 {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                     <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {volunteers?.map((vol: any) => (
                            <div 
                                key={vol._id || vol.id} 
                                className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted ${selectedVolunteerId === (vol._id || vol.id) ? 'border-primary bg-primary/10' : ''}`}
                                onClick={() => setSelectedVolunteerId(vol._id || vol.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{vol.firstName} {vol.lastName}</div>
                                        <div className="text-xs text-muted-foreground">{vol.mobileNumber}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {volunteers?.length === 0 && <div className="text-center text-muted-foreground py-4">{t("DISPATCH.NO_VOLUNTEERS")}</div>}
                     </div>
                 )}
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>{t("COMMON.CANCEL")}</Button>
                <Button 
                    disabled={!selectedVolunteerId || assignMutation.isPending} 
                    onClick={() => assignMutation.mutate()}
                >
                    {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("DISPATCH.CONFIRM")}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
  );
}
