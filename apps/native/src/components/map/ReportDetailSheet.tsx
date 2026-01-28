import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Modal, TextInput } from "react-native";
import { AppText, AppButton, Icon, Avatar } from "@/components/ui";
import { cn } from "@/utils";
import { ENUM_REPORT_STATUS, ENUM_USER_ROLE, ENUM_REPORT_TYPE, ENUM_REPORT_SEVERITY } from "@repo/shared";
import { Navigation, Phone, TriangleAlert, Utensils, Droplet, Stethoscope, LifeBuoy, CircleHelp, Activity, Clock, Ban, CheckCircle2, FileText } from "lucide-react-native";
import { formatTimeAgo, isUserOnline } from "@/utils/date";
import { useTranslation } from "react-i18next";

interface ReportDetailSheetProps {
  selectedReport: any;
  onClose: () => void;
  isVolunteerMode: boolean;
  user: any;
  userLocation: { latitude: number; longitude: number } | null;
  isActionLoading: boolean;
  handleReportAction: (action: "accept" | "reject" | "cancel" | "complete", data?: any) => void;
  handleCall: (phone?: string) => void;
}

const REJECT_REASONS = [
    "REPORT.REJECT_REASON.DUPLICATE",
    "REPORT.REJECT_REASON.SPAM",
    "REPORT.REJECT_REASON.RESOLVED",
    "REPORT.REJECT_REASON.UNREACHABLE",
    "REPORT.REJECT_REASON.OTHER"
];

export const ReportDetailSheet = ({
  selectedReport,
  onClose,
  isVolunteerMode,
  user,
  userLocation,
  isActionLoading,
  handleReportAction,
  handleCall,
}: ReportDetailSheetProps) => {
  const { t } = useTranslation();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const isOwner = user?._id === selectedReport.user?._id || user?._id === selectedReport.user;

  // Check verification (Safe check)
  const isUnverifiedUser = selectedReport.user && 
                           typeof selectedReport.user === 'object' && 
                           (!selectedReport.user.verification?.email && !selectedReport.user.verification?.mobileNumber);

  const getPinColorClass = (status: ENUM_REPORT_STATUS) => {
    switch (status) {
      case ENUM_REPORT_STATUS.PENDING:
        return "bg-red-500 border-red-200";
      case ENUM_REPORT_STATUS.IN_PROGRESS:
        return "bg-yellow-500 border-yellow-200";
      case ENUM_REPORT_STATUS.RESOLVED:
        return "bg-green-500 border-green-200";
      default:
        return "bg-gray-500 border-gray-200";
    }
  };

  const getTypeIcon = (type: ENUM_REPORT_TYPE) => {
      switch (type) {
        case ENUM_REPORT_TYPE.FOOD: return <Utensils size={20} className="text-orange-500" />;
        case ENUM_REPORT_TYPE.WATER: return <Droplet size={20} className="text-blue-500" />;
        case ENUM_REPORT_TYPE.MEDICAL: return <Stethoscope size={20} className="text-red-500" />;
        case ENUM_REPORT_TYPE.EVACUATION: return <LifeBuoy size={20} className="text-yellow-500" />;
        case ENUM_REPORT_TYPE.OTHER: return <CircleHelp size={20} className="text-gray-500" />;
        default: return <CircleHelp size={20} className="text-gray-500" />;
      }
  };

  const getStatusIcon = (status: ENUM_REPORT_STATUS) => {
      switch (status) {
        case ENUM_REPORT_STATUS.PENDING: return <Clock size={12} color="white" />;
        case ENUM_REPORT_STATUS.IN_PROGRESS: return <Activity size={12} color="white" />;
        case ENUM_REPORT_STATUS.RESOLVED: return <CheckCircle2 size={12} color="white" />;
        case ENUM_REPORT_STATUS.REJECTED: return <Ban size={12} color="white" />;
        default: return <Activity size={12} color="white" />;
      }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case ENUM_REPORT_SEVERITY.LOW:
        return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
      case ENUM_REPORT_SEVERITY.MEDIUM:
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300";
      case ENUM_REPORT_SEVERITY.HIGH:
        return "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300";
      case ENUM_REPORT_SEVERITY.CRITICAL:
        return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const onConfirmReject = () => {
      const finalReason = selectedReason === "REPORT.REJECT_REASON.OTHER" ? customReason : t(selectedReason);
      if (!finalReason) {
          Alert.alert(t("COMMON.ERROR"), t("REPORT.REJECT_REASON.REQUIRED"));
          return;
      }
      handleReportAction("reject", { reason: finalReason });
      setShowRejectModal(false);
  };

  const guestPhoneMatch = selectedReport.notes?.match(/Guest Phone: ([\d+]+)/);
  const guestPhone = guestPhoneMatch ? guestPhoneMatch[1] : null;
  const isGuestReport = selectedReport.source === 'guest' || !!guestPhone;
  
  // Clean notes by removing the Guest Phone part if it exists
  const displayNotes = isGuestReport 
    ? selectedReport.notes?.replace(/Guest Phone: [\d+]+/, '').trim() 
    : selectedReport.notes;

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutrals900 rounded-t-3xl shadow-2xl z-50 max-h-[85%] flex-1">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className={cn(
                  "px-2 py-0.5 rounded flex-row items-center gap-1",
                  getPinColorClass(selectedReport.status).split(" ")[0]
                )}
              >
                {getStatusIcon(selectedReport.status)}
                <AppText className="text-white font-bold uppercase text-[10px]">
                  {t(`REPORT.STATUS.${selectedReport.status}`)}
                </AppText>
              </View>
              
              <View className={cn(
                "px-2 py-0.5 rounded",
                isGuestReport ? "bg-orange-100 dark:bg-orange-900/30" : "bg-blue-100 dark:bg-blue-900/30"
              )}>
                <AppText className={cn(
                  "text-[10px] font-bold uppercase",
                  isGuestReport ? "text-orange-700 dark:text-orange-300" : "text-blue-700 dark:text-blue-300"
                )}>
                  {selectedReport.source ? t(`REPORT.SOURCE.${selectedReport.source.toUpperCase()}`) : (isGuestReport ? t('REPORT.SOURCE.GUEST') : t('REPORT.SOURCE.APP'))}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1">
                 <Icon name="Calendar" size={14} className="text-gray-400 dark:text-gray-500" />
                 <AppText raw className="text-gray-400 dark:text-gray-500 text-xs">
                  {new Date(selectedReport.createdAt).toLocaleTimeString()} -{" "}
                  {new Date(selectedReport.createdAt).toLocaleDateString()}
                </AppText>
              </View>
            </View>
            
            <View className="flex-row items-center gap-2">
                {getTypeIcon(selectedReport.type)}
                <AppText variant="heading4" className="font-bold text-foreground">
                    {t(`REPORT.TYPE.${selectedReport.type.toLowerCase()}`)}
                </AppText>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="p-1 bg-gray-100 dark:bg-neutrals800 rounded-full"
          >
            <Icon name="X" size={20} className="text-black dark:text-white" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-row gap-2 mb-4 bg-gray-50 dark:bg-neutrals800 p-3 rounded-xl border border-gray-100 dark:border-neutrals700">
             <FileText size={16} className="text-gray-500 mt-0.5" />
             <AppText raw className="text-gray-600 dark:text-gray-300 leading-5 flex-1">
                {displayNotes || t('REPORT.DETAIL.NO_DESCRIPTION')}
             </AppText>
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className={`bg-gray-50 dark:bg-neutrals800 p-2 rounded-lg flex-1 items-center justify-center ${isGuestReport ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30' : ''}`}>
             {isGuestReport ? (
                 <>
                    <AppText className="text-xs text-gray-400 mb-1">{t('COMMON.PHONE_NUMBER')}</AppText>
                    {guestPhone ? (
                        <TouchableOpacity 
                            onPress={() => handleCall(guestPhone)}
                            className="flex-row items-center gap-2 bg-green-500 px-3 py-1.5 rounded-full"
                        >
                            <Phone size={14} color="white" />
                            <AppText className="font-bold text-white text-sm">
                                {guestPhone}
                            </AppText>
                        </TouchableOpacity>
                    ) : (
                        <AppText className="font-bold text-lg text-gray-400">
                             --
                        </AppText>
                    )}
                 </>
             ) : (
                 <>
                    <AppText className="text-xs text-gray-400">{t('REPORT.DETAIL.LABEL_PEOPLE')}</AppText>
                    <AppText className="font-bold text-lg text-foreground">
                        {selectedReport.peopleCount}
                    </AppText>
                 </>
             )}
          </View>

          {/* Framed Severity Box */}
          <View className={cn("flex-1 items-center justify-center p-2 rounded-lg border", getSeverityStyle(selectedReport.severity).split(" ").slice(0, 3).join(" "))}>
            <AppText className="text-xs text-gray-500 mb-0.5">{t('REPORT.DETAIL.LABEL_SEVERITY')}</AppText>
            <AppText className={cn("font-bold text-lg uppercase", getSeverityStyle(selectedReport.severity).split(" ").slice(3).join(" "))}>
               {t(`REPORT.SEVERITY.${selectedReport.severity}`)}
            </AppText>
          </View>
        </View>

        {/* Info User (Người tạo / Guest) */}
        {isGuestReport ? (
           <View className="flex-row items-center justify-between mb-6 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-500/30">
            <View className="flex-row items-center">
              <View className="bg-red-100 dark:bg-red-800 p-2 rounded-full">
                  <Icon name="Siren" size={20} className="text-red-600 dark:text-red-200" />
              </View>
              <View className="ml-3">
                <AppText className="text-xs text-red-500 dark:text-red-300 font-bold uppercase">
                  {t('REPORT.GUEST_SOS')}
                </AppText>
                <AppText className="font-bold text-foreground">
                  {t('COMMON.GUEST_USER')}
                </AppText>
              </View>
            </View>
            {(isVolunteerMode || user?.role === ENUM_USER_ROLE.ADMIN) && selectedReport.notes?.match(/Guest Phone: ([\d+]+)/)?.[1] && (
              <TouchableOpacity
                onPress={() => handleCall(selectedReport.notes?.match(/Guest Phone: ([\d+]+)/)?.[1])}
                className="bg-green-500 p-2.5 rounded-full shadow-sm"
              >
                <Phone size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : selectedReport.isProxyReport && selectedReport.proxyData ? (
             <View className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-500/20 mb-4">
                 <View className="flex-row items-center mb-3 pb-2 border-b border-orange-200 dark:border-orange-500/30">
                     <View className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-full mr-2">
                        <Icon name="UsersRound" size={16} className="text-orange-600 dark:text-orange-400" />
                     </View>
                     <View>
                         <AppText className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase">
                             {t('MAP.CREATE.PROXY.TITLE')}
                         </AppText>
                         <AppText className="text-[10px] text-gray-400">
                             {t('MAP.CREATE.PROXY.DESC')}
                         </AppText>
                     </View>
                 </View>

                 <View className="gap-2">
                     <View className="flex-row">
                         <AppText className="text-gray-500 w-24 text-xs">{t('REPORT.VICTIM')}</AppText>
                         <AppText className="font-bold flex-1 text-foreground">{selectedReport.proxyData.victimName}</AppText>
                     </View>
                     <View className="flex-row">
                         <AppText className="text-gray-500 w-24 text-xs">{t('REPORT.DETAIL.LABEL_PEOPLE')}</AppText>
                         <AppText className="font-bold flex-1 text-foreground">{selectedReport.proxyData.victimCount}</AppText>
                     </View>
                     {selectedReport.proxyData.victimNote && (
                        <View className="flex-row">
                            <AppText className="text-gray-500 w-24 text-xs">{t('COMMON.NOTE', 'Note')}</AppText>
                            <AppText className="italic text-gray-600 dark:text-gray-300 flex-1">{selectedReport.proxyData.victimNote}</AppText>
                        </View>
                     )}
                 </View>

                 {/* Reporter Info (Who reported this proxy) */}
                 {selectedReport.user && (
                      <View className="mt-3 pt-2 border-t border-orange-200 dark:border-orange-500/20 flex-row items-center justify-between">
                           <View className="flex-row items-center gap-2">
                               <AppText className="text-[10px] text-gray-400">{t('REPORT.REPORTER')}:</AppText>
                               <AppText className="text-xs font-bold text-foreground">
                                   {selectedReport.user.firstName} {selectedReport.user.lastName}
                               </AppText>
                           </View>
                           {(isVolunteerMode || user?.role === ENUM_USER_ROLE.ADMIN) && selectedReport.user.mobileNumber && (
                               <TouchableOpacity onPress={() => handleCall(selectedReport.user.mobileNumber)}>
                                    <Icon name="Phone" size={14} className="text-green-600" />
                               </TouchableOpacity>
                           )}
                      </View>
                 )}
             </View>
        ) : selectedReport.user && (
          <View className={`flex-row items-center justify-between mb-2 p-3 rounded-xl ${isUnverifiedUser ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-100' : 'bg-gray-50 dark:bg-neutrals800'}`}>
            <View className="flex-row items-center flex-1">
              <Avatar size="md" text={selectedReport.user.firstName} />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center gap-2">
                    <AppText className="text-xs text-gray-400">
                    {t('REPORT.DETAIL.LABEL_VICTIM')}
                    </AppText>
                    {isUnverifiedUser && (
                        <View className="bg-orange-100 dark:bg-orange-800 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                            <TriangleAlert size={10} className="text-orange-600 dark:text-orange-200" />
                            <AppText className="text-[10px] text-orange-600 dark:text-orange-200 font-bold">Unverified</AppText>
                        </View>
                    )}
                </View>
                <AppText className="font-bold text-foreground">
                  {selectedReport.user.firstName} {selectedReport.user.lastName}
                </AppText>
                {/* Online Status của Victim */}
                <View className="flex-row items-center gap-1 mt-0.5">
                   <View 
                    className={`w-1.5 h-1.5 rounded-full ${
                      isUserOnline(selectedReport.user?.lastLocationAt) ? 'bg-green-500' : 'bg-gray-400'
                    }`} 
                  />
                  <AppText className="text-[10px] text-gray-400">
                    {formatTimeAgo(selectedReport.user?.lastLocationAt)}
                  </AppText>
                </View>
              </View>
            </View>
            {/* Chỉ hiện nút gọi nếu là Volunteer/Admin */}
            {(isVolunteerMode || user?.role === ENUM_USER_ROLE.ADMIN) && (
              <TouchableOpacity
                onPress={() => handleCall(selectedReport.user?.mobileNumber)}
                className="bg-green-500 p-2 rounded-full"
              >
                <Phone size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Warning Message for Unverified */}
        {isUnverifiedUser && (isVolunteerMode || user?.role === ENUM_USER_ROLE.ADMIN) && (
            <View className="mb-6 mx-1">
                <AppText className="text-xs italic text-orange-600 dark:text-orange-400">
                    ⚠ {t('REPORT.DETAIL.WARNING_UNVERIFIED')}
                </AppText>
            </View>
        )}

        {/* ACTION BUTTONS (Logic quan trọng) */}
        {!isOwner && (
        <View className="flex-row gap-2">
          {/* 3. Nút Chỉ Đường (Chung cho tất cả) - Render First as requested (Equal part) */}
          <TouchableOpacity
            className="flex-1 items-center justify-center flex-row gap-2 border border-gray-300 dark:border-neutrals700 rounded-xl bg-gray-50 dark:bg-neutrals800 px-2"
            onPress={() => {
               if (selectedReport.location?.coordinates) {
                   const dest = `${selectedReport.location.coordinates[1]},${selectedReport.location.coordinates[0]}`;
                   let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
                   if (userLocation) {
                       url += `&origin=${userLocation.latitude},${userLocation.longitude}`;
                   }
                   Linking.openURL(url);
               }
            }}
          >
            <Navigation size={18} className="text-black dark:text-white" />
          </TouchableOpacity>

          {/* 1. Nếu là VOLUNTEER và Report đang PENDING -> Nút NHẬN (Equal part) và Nút TỪ CHỐI (Equal part) */}
          {isVolunteerMode &&
            selectedReport.status === ENUM_REPORT_STATUS.PENDING && (
                <View className="flex-[2] flex-row gap-2">
                      <AppButton
                        disabled={isActionLoading}
                        onPress={() => handleReportAction("accept")}
                        className="flex-1 bg-blue-600 rounded-xl justify-center items-center shadow-md dark:shadow-none"
                        textClassname="text-white font-bold"
                      >
                        {isActionLoading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <CheckCircle2 size={24} color="white" />
                        )}
                      </AppButton>
                      
                     <AppButton
                        disabled={isActionLoading}
                        onPress={() => setShowRejectModal(true)} 
                        className="flex-1 bg-red-100 dark:bg-red-900/30 rounded-xl justify-center items-center"
                        textClassname="text-red-600 dark:text-red-400 font-bold"
                      >
                        <Ban size={24} className="text-red-600 dark:text-red-400" />
                      </AppButton>
                </View>
            )}

          {/* 2. Nếu là VOLUNTEER và Report đang IN_PROGRESS (của mình) -> Nút HỦY/HOÀN THÀNH */}
          {isVolunteerMode &&
            selectedReport.status === ENUM_REPORT_STATUS.IN_PROGRESS &&
            ((typeof selectedReport.rescuer === 'object' ? selectedReport.rescuer?._id : selectedReport.rescuer) === user?._id) && (
              <View className="flex-[2] flex-row gap-2">
                 <AppButton
                  disabled={isActionLoading}
                  onPress={() => {
                    Alert.alert(
                      t('COMMON.CONFIRM') || 'Confirm',
                      t('REPORT.CONFIRM.CANCEL') || 'Are you sure you want to cancel this mission? The report will be available for others.',
                      [
                        { text: t('COMMON.NO') || 'No', style: 'cancel' },
                        { 
                          text: t('COMMON.YES') || 'Yes', 
                          style: 'destructive',
                          onPress: () => handleReportAction("cancel")
                        }
                      ]
                    );
                  }} 
                  className="flex-1 bg-orange-100 dark:bg-orange-900/30 rounded-xl justify-center items-center"
                >
                  <Icon name="CircleX" size={24} className="text-orange-600 dark:text-orange-400" />
                </AppButton>
                <AppButton
                  disabled={isActionLoading}
                  onPress={() => handleReportAction("complete")}
                  className="flex-1 bg-green-600 rounded-xl shadow-md elevation-3 justify-center items-center"
                >
                   {isActionLoading ? <ActivityIndicator color="white" /> : <CheckCircle2 size={24} color="white" />}
                </AppButton>
              </View>
            )}
        </View>
        )}
      </ScrollView>

      {/* REJECT REASON MODAL */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
              <View className="bg-white dark:bg-neutrals800 w-full max-w-sm rounded-2xl p-6">
                  <View className="items-center mb-4">
                      <View className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-2">
                          <Ban size={32} className="text-red-600 dark:text-red-400" />
                      </View>
                      <AppText variant="heading4" className="font-bold text-center text-foreground">{t('REPORT.REJECT_REASON.TITLE')}</AppText>
                  </View>
                  
                  {REJECT_REASONS.map((reason) => (
                      <TouchableOpacity 
                        key={reason}
                        onPress={() => setSelectedReason(reason)}
                        className={`p-3 rounded-xl border mb-2 ${selectedReason === reason ? 'bg-primary/10 border-primary' : 'border-gray-200 dark:border-neutrals700'}`}
                      >
                          <AppText className={`${selectedReason === reason ? 'text-primary font-bold' : 'text-foreground'}`}>
                              {t(reason)}
                          </AppText>
                      </TouchableOpacity>
                  ))}

                  {selectedReason === "REPORT.REJECT_REASON.OTHER" && (
                       <TextInput 
                          placeholder={t('REPORT.REJECT_REASON.PLACEHOLDER')}
                          value={customReason}
                          onChangeText={setCustomReason}
                          className="bg-gray-50 dark:bg-neutrals900 p-3 rounded-lg border border-gray-200 dark:border-neutrals700 mt-2 text-foreground"
                       />
                  )}

                  <View className="flex-row gap-3 mt-6">
                      <TouchableOpacity onPress={() => setShowRejectModal(false)} className="flex-1 py-3 items-center">
                          <AppText className="text-gray-500 font-bold">{t('COMMON.CANCEL')}</AppText>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={onConfirmReject} className="flex-1 bg-red-600 py-3 rounded-xl items-center shadow-lg">
                          <AppText className="text-white font-bold">{t('COMMON.CONFIRM')}</AppText>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

    </View>
  );
};
