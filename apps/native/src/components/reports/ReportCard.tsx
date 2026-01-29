import React from "react";
import { View, TouchableOpacity, Linking } from "react-native";
import { AppText, Icon, Badge } from "@/components/ui";
import { ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS, ENUM_USER_ROLE } from "@repo/shared";
import { useTranslation } from "react-i18next";

interface ReportCardProps {
  item: any;
  user: any;
  handleAccept: (id: string) => void;
  handleReject: (id: string, data?: any) => void;
  handleResolve: (id: string) => void;
  handleDelete: (id: string) => void;
  handleCancel?: (id: string) => void;
  setEditingReport: (report: any) => void;
  handleViewOnMap: (lat: number, long: number) => void;
  isOwner?: boolean;
}

export const ReportCard = ({
  item,
  user,
  handleAccept,
  handleReject,
  handleResolve,
  handleDelete,
  handleCancel,
  setEditingReport,
  handleViewOnMap,
  isOwner: isOwnerProp,
}: ReportCardProps) => {
  const { t } = useTranslation();
  const currentUserId = user?._id?.toString();
  
  // Logic to identify Guest Report (Source or Content)
  const isGuest = item.source === 'GUEST' || (typeof item.notes === 'string' && item.notes.includes('Guest Phone:'));
  
  // Use prop if available, otherwise fallback to check
  const isOwner = isOwnerProp ?? (item.by === currentUserId || item.user === currentUserId || item.user?._id === currentUserId || item.by?._id === currentUserId);
  const isAdmin = user?.role === ENUM_USER_ROLE.ADMIN;
  const isVolunteer = user?.isVolunteer;

  // Fix: Check rescuers array
  let isMyMission = false;
  if (isVolunteer && item.status === ENUM_REPORT_STATUS.IN_PROGRESS) {
      if (item.rescuers && Array.isArray(item.rescuers)) {
          isMyMission = item.rescuers.some((r: any) => {
               const rId = (typeof r === 'object' ? r._id : r)?.toString();
               return rId === currentUserId;
          });
      }
  }

  const canEdit =
    (isOwner || isAdmin) && item.status === ENUM_REPORT_STATUS.PENDING;
  const canDelete =
    (isOwner || isAdmin) && item.status === ENUM_REPORT_STATUS.PENDING;
  const canAccept =
    isVolunteer &&
    (item.status === ENUM_REPORT_STATUS.PENDING || item.status === ENUM_REPORT_STATUS.IN_PROGRESS) && // Allow joining in-progress
    !isOwner &&
    !isMyMission; // Not already my mission
  
  const canReject =
    isAdmin && item.status === ENUM_REPORT_STATUS.PENDING; // Only admin can reject PENDING reports
  const canResolve = isMyMission; // Rescuer can resolve
  const canCancel = isMyMission && !!handleCancel; // Volunteer can cancel their accepted mission

  // ... (color helpers omit)
  const getSeverityColor = (severity: ENUM_REPORT_SEVERITY) => {
    switch (severity) {
      case ENUM_REPORT_SEVERITY.CRITICAL:
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      case ENUM_REPORT_SEVERITY.HIGH:
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";
      case ENUM_REPORT_SEVERITY.MEDIUM:
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20";
      default:
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";
    }
  };

  const getStatusColorClass = (status: ENUM_REPORT_STATUS) => {
    switch (status) {
      case ENUM_REPORT_STATUS.RESOLVED:
        return "text-blue-600 dark:text-blue-400";
      case ENUM_REPORT_STATUS.IN_PROGRESS:
        return "text-yellow-600 dark:text-yellow-400";
      case ENUM_REPORT_STATUS.REJECTED:
        return "text-red-500 dark:text-red-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const formatCoordinates = (coords: [number, number]) => {
    if (!coords || coords.length < 2) return "Unknown location";
    return `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
  };
  
  // ... (Header Render omit - assume unchanged from previous steps unless necessary)
  // Wait I should not replace the whole file if I can avoid it.
  // But I need to update Props and `canReject`, `canResolve` logic at the top.
  // And the buttons at the bottom.
  
  // Let's do partial replace for Props and Logic, then another for Buttons.
  // Actually, I'll replace the top part first.


  return (
    <View className="bg-white dark:bg-neutrals900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-neutrals800">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <View className="flex-row flex-wrap gap-2 mb-1">
             <Badge
              className={`border px-2 py-0.5 rounded-md flex-row items-center gap-1 ${getSeverityColor(item.severity)}`}
            >
              <Icon 
                name={item.severity === ENUM_REPORT_SEVERITY.CRITICAL ? 'TriangleAlert' : 'Flag'} 
                size={10} 
                className={item.severity === ENUM_REPORT_SEVERITY.CRITICAL ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'} 
              />
              <AppText className="text-[10px] font-sans-bold uppercase">
                {t(`REPORT.SEVERITY.${item.severity}`)}
              </AppText>
            </Badge>

            {/* SOURCE BADGE */}
            <Badge
              className={`border px-2 py-0.5 rounded-md flex-row items-center gap-1 ${
                  isGuest 
                  ? "bg-purple-100 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20" 
                  : "bg-blue-100 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20"
              }`}
            >
              <Icon 
                name={isGuest ? 'Phone' : 'Smartphone'} 
                size={10} 
                className={isGuest ? 'text-purple-700 dark:text-purple-400' : 'text-blue-700 dark:text-blue-400'} 
              />
              <AppText className={`text-[10px] font-sans-bold uppercase ${isGuest ? 'text-purple-700 dark:text-purple-400' : 'text-blue-700 dark:text-blue-400'}`}>
                {isGuest ? t('REPORT.SOURCE.GUEST') : t('REPORT.SOURCE.APP')}
              </AppText>
            </Badge>
          </View>

          <View className="flex-row items-center mt-1 gap-2">
            <Icon name="Megaphone" size={16} className="text-foreground" />
            <AppText
              variant="heading4"
              className="font-sans-bold text-foreground uppercase"
            >
              {t(`REPORT.TYPE.${item.type}`) }
            </AppText>
          </View>
        </View>
        <View className="flex-row items-center gap-1.5">
           <Icon name="Calendar" size={12} className="text-neutrals400 dark:text-neutrals200" />
            <AppText raw className="text-xs text-neutrals400 dark:text-neutrals200 font-sans-medium">
            {(() => {
                try {
                    const d = new Date(item.createdAt);
                    if (isNaN(d.getTime())) return t('COMMON.DATE_INVALID');
                    const hours = d.getHours().toString().padStart(2, '0');
                    const minutes = d.getMinutes().toString().padStart(2, '0');
                    const day = d.getDate().toString().padStart(2, '0');
                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                    const year = d.getFullYear();
                    return `${hours}:${minutes} - ${day}/${month}/${year}`;
                } catch (e) {
                    return t('COMMON.DATE_ERROR');
                }
            })()}
            </AppText>
        </View>
      </View>

      {/* Info - Coordinates replace Address */}
      <View className="gap-2 mb-4">
        <View className="flex-row items-center">
          <Icon name="MapPin" className="w-4 h-4 text-neutrals400 dark:text-neutrals100 mr-2" />
          <AppText
            raw
            className="text-sm text-foreground flex-1"
            numberOfLines={1}
          >
            {formatCoordinates(item.location.coordinates)}
          </AppText>
        </View>
        {(() => {
           if (!item.notes) return null;
           const cleanNote = item.notes.replace(/Guest Phone:\s*[\d+]+/, '').trim();
           if (!cleanNote) return null;
           
           return (
             <View className="bg-gray-50 dark:bg-neutrals800 p-3 rounded-lg flex-row items-start">
                <View className="h-5 justify-center mr-2">
                   <Icon name="FileText" className="w-4 h-4 text-neutrals400 dark:text-neutrals100" />
                </View>
               <AppText raw className="text-sm text-foreground italic flex-1 leading-5">
                 "{cleanNote}"
               </AppText>
             </View>
           );
        })()}
      </View>

      {/* Phone Numbers / Victim Info */}
      <View className="mb-4 gap-2">
         {/* Reporter Info */}
         {item.by && typeof item.by === 'object' && (
             <View className="flex-col gap-1">
                 {/* Name */}
                 {((item.by as any).firstName || (item.by as any).lastName) && (
                    <View className="flex-row items-center">
                      <Icon name="User" className="w-3.5 h-3.5 text-neutrals400 dark:text-neutrals100 mr-2" />
                      <AppText className="text-xs text-neutrals500 dark:text-neutrals200">
                          {t('REPORT.REPORTER')}: <AppText className="text-foreground font-sans-medium">
                              {`${(item.by as any).lastName || ''} ${(item.by as any).firstName || ''}`.trim()}
                          </AppText>
                      </AppText>
                  </View>
                 )}

                 {/* Phone */}
                 {(item.by as any).mobileNumber && (
                    <View className="flex-row items-center">
                        <Icon name="Phone" className="w-3.5 h-3.5 text-neutrals400 dark:text-neutrals100 mr-2" />
                        <AppText className="text-xs text-neutrals500 dark:text-neutrals200">
                            {t('COMMON.PHONE')}: <AppText className="text-foreground font-sans-medium">{(item.by as any).mobileNumber}</AppText>
                        </AppText>
                    </View>
                 )}
             </View>
         )}

         {/* Guest Info */}
         {item.source === 'GUEST' ? (
            <View className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg gap-1 border border-red-100 dark:border-red-500/30">
                <View className="flex-row items-center">
                    <Icon name="Siren" className="w-3.5 h-3.5 text-red-600 dark:text-red-400 mr-2" />
                    <AppText className="text-xs text-red-700 dark:text-red-300 font-sans-bold">
                        {t('REPORT.GUEST_SOS') || 'Guest SOS'}
                    </AppText>
                </View>
                {item.notes && item.notes.includes('Guest Phone:') && (
                     <AppText className="text-xs text-red-600 dark:text-red-400 ml-5.5">
                        {t('COMMON.PHONE')}: <AppText className="font-sans-bold">{item.notes.match(/Guest Phone: ([\d+]+)/)?.[1] || 'N/A'}</AppText>
                    </AppText>
                )}
            </View>
         ) : item.isProxyReport && item.proxyData ? (
            <View className="bg-orange-50 dark:bg-orange-500/10 p-2.5 rounded-lg gap-2 border border-orange-100 dark:border-orange-500/20">
                {/* Header for Proxy */}
                <View className="flex-row items-center border-b border-orange-200 dark:border-orange-500/30 pb-1.5 mb-0.5">
                    <Icon name="UsersRound" className="w-4 h-4 text-orange-600 mr-2" />
                    <AppText className="text-xs text-orange-700 dark:text-orange-400 font-sans-bold uppercase">
                        {t('MAP.CREATE.PROXY.TITLE')}
                    </AppText>
                </View>

                {/* Victim Name */}
                <View className="flex-row items-start">
                    <AppText className="text-xs text-neutrals500 dark:text-neutrals300 w-20">
                        {t('REPORT.VICTIM')}:
                    </AppText>
                    <AppText className="text-xs text-foreground font-sans-bold flex-1">
                        {(item.proxyData as any).victimName || t('COMMON.UNKNOWN')}
                    </AppText>
                </View>

                {/* Victim Count */}
                 <View className="flex-row items-start">
                    <AppText className="text-xs text-neutrals500 dark:text-neutrals300 w-20">
                        {t('REPORT.DETAIL.LABEL_PEOPLE')}:
                    </AppText>
                    <AppText className="text-xs text-foreground font-sans-bold flex-1">
                         {(item.proxyData as any).victimCount || 1}
                    </AppText>
                </View>

                {/* Victim Note */}
                {(item.proxyData as any).victimNote && (
                 <View className="flex-row items-start">
                    <AppText className="text-xs text-neutrals500 dark:text-neutrals300 w-20">
                        {t('COMMON.NOTE', 'Note')}:
                    </AppText>
                    <AppText className="text-xs text-foreground italic flex-1">
                        {(item.proxyData as any).victimNote}
                    </AppText>
                </View>
                )}
            </View>
         ) : (
            item.user && typeof item.user === 'object' && (item.user as any).mobileNumber && item.user._id !== (typeof item.by === 'object' ? item.by._id : item.by) && (
                <View className="flex-row items-center">
                    <Icon name="TriangleAlert" className="w-3.5 h-3.5 text-neutrals400 dark:text-neutrals100 mr-2" />
                        <AppText className="text-xs text-neutrals500 dark:text-neutrals200">
                        {t('REPORT.VICTIM')}: <AppText className="text-foreground font-sans-medium">{(item.user as any).mobileNumber}</AppText>
                    </AppText>
                </View>
            )
         )}
         
         {/* Rejected Reason */}
         {item.status === ENUM_REPORT_STATUS.REJECTED && item.rejectReason && (
            <View className="mt-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg gap-1 border border-red-100 dark:border-red-500/30">
                <View className="flex-row items-center mb-1">
                    <Icon name="CircleX" className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                    <AppText className="text-xs text-red-700 dark:text-red-300 font-sans-bold uppercase">
                        {t('REPORT.REJECTION_REASON')}
                    </AppText>
                </View>
                <AppText className="text-sm text-red-800 dark:text-red-200 ml-6">
                    {item.rejectReason}
                </AppText>
            </View>
         )}
      </View>

      {/* Footer Stats ... skipped small parts ... */}
      <View className="flex-row justify-between items-center py-3 border-t border-gray-100 dark:border-neutrals800">
        <View className="flex-row items-center gap-4">
           {/* People Count OR Guest Phone */}
           {isGuest ? (
             <View className="flex-row items-center gap-1.5 p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Icon name="Phone" className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <AppText className="text-xs font-sans-bold text-purple-700 dark:text-purple-300">
                  {item.notes?.match(/Guest Phone: ([\d+]+)/)?.[1] || 'N/A'}
                </AppText>
             </View>
           ) : (
             <View className="flex-row items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-neutrals800 rounded-lg">
              <Icon name="Users" className="w-3.5 h-3.5 text-neutrals500 dark:text-neutrals100" />
              <AppText className="text-xs font-sans-bold text-foreground">
                {item.peopleCount}
              </AppText>
             </View>
           )}
          
          <View className={`flex-row items-center gap-1.5 px-2 py-1 rounded-lg border ${
            item.status === 'PENDING' ? 'bg-gray-50 border-gray-100 dark:bg-neutrals800 dark:border-neutrals700' :
            item.status === 'IN_PROGRESS' ? 'bg-yellow-50 border-yellow-100 dark:bg-yellow-500/10 dark:border-yellow-500/20' :
            item.status === 'RESOLVED' ? 'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20' :
            item.status === 'VERIFIED' ? 'bg-green-50 border-green-100 dark:bg-green-500/10 dark:border-green-500/20' :
            'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20'
          }`}>
             {/* Icon logic skipped for brevity, assumed unchanged in functionality */}
            <Icon
              name={
                  item.status === 'RESOLVED' ? 'CircleCheck' :
                  item.status === 'IN_PROGRESS' ? 'Activity' :
                  item.status === 'VERIFIED' ? 'ShieldCheck' :
                  item.status === 'CANCELLED' || item.status === 'REJECTED' ? 'CircleX' :
                  'Clock'
              }
              className={`w-3.5 h-3.5 ${getStatusColorClass(item.status)}`}
            />
            <AppText
              className={`text-xs font-sans-bold uppercase ${getStatusColorClass(item.status)}`}
            >
              {item.status ? t(`REPORT.STATUS.${item.status}`) : t('COMMON.UNKNOWN')}
            </AppText>
          </View>
        </View>
      </View>

      {/* Action Buttons Grid */}
      <View className="flex-row gap-2 mt-2 flex-wrap">
        {!isOwner && (
          <>
            <TouchableOpacity
              onPress={() => item.location?.coordinates && handleViewOnMap(item.location.coordinates[1], item.location.coordinates[0])}
              className="flex-1 bg-gray-100 dark:bg-neutrals800 px-3 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Icon name="LocateFixed" className="w-4 h-4 text-foreground" />
              <AppText className="text-xs font-sans-bold text-foreground">{t('REPORT.CARD.BTN_MAP')}</AppText>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => item.location?.coordinates && Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${item.location.coordinates[1]},${item.location.coordinates[0]}`)}
              className="flex-1 bg-gray-100 dark:bg-neutrals800 px-3 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Icon name="Navigation" className="w-4 h-4 text-foreground" />
              <AppText className="text-xs font-sans-bold text-foreground">{t('REPORT.CARD.BTN_DIRECTIONS')}</AppText>
            </TouchableOpacity>
          </>
        )}

        {canAccept && (
          <TouchableOpacity
            onPress={() => handleAccept(item._id)}
            className="flex-1 bg-blue-600 px-3 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Icon name="HandHelping" className="w-4 h-4 text-white" />
            <AppText className="text-white font-sans-bold text-xs">
              {t('REPORT.CARD.BTN_ACCEPT')}
            </AppText>
          </TouchableOpacity>
        )}
        {canResolve && (
          <TouchableOpacity
            onPress={() => handleResolve(item._id)}
            className="flex-1 bg-green-600 px-3 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Icon name="CircleCheck" className="w-4 h-4 text-white" />
            <AppText className="text-white font-sans-bold text-xs">
              {t('REPORT.CARD.BTN_RESOLVE')}
            </AppText>
          </TouchableOpacity>
        )}
        {canCancel && (
          <TouchableOpacity
            onPress={() => handleCancel!(item._id)}
            className="flex-1 bg-orange-100 dark:bg-orange-500/10 px-3 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Icon name="CircleX" className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <AppText className="text-orange-600 dark:text-orange-400 font-sans-bold text-xs">
              {t('REPORT.CARD.BTN_CANCEL') || 'Cancel'}
            </AppText>
          </TouchableOpacity>
        )}
        {canReject && (
          <TouchableOpacity
            onPress={() => handleReject(item._id)}
            className="flex-1 bg-red-100 dark:bg-red-500/10 px-3 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Icon name="CircleX" className="w-4 h-4 text-red-600 dark:text-red-400" />
            <AppText className="text-red-600 dark:text-red-400 font-sans-bold text-xs">
              {t('REPORT.CARD.BTN_REJECT')}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Edit/Delete Actions (Smaller, secondary) */}
      {(canEdit || canDelete) && (
        <View className="flex-row justify-end gap-2 mt-2 pt-2 border-t border-gray-50 dark:border-neutrals800/50">
           {canEdit && (
          <TouchableOpacity
            onPress={() => setEditingReport(item)}
            className="p-2"
          >
            <AppText className="text-xs text-neutrals400 font-sans-medium">{t('REPORT.CARD.BTN_EDIT')}</AppText>
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity
            onPress={() => handleDelete(item._id)}
            className="p-2"
          >
             <AppText className="text-xs text-red-400 font-sans-medium">{t('REPORT.CARD.BTN_DELETE')}</AppText>
          </TouchableOpacity>
        )}
        </View>
      )}
    </View>
  );
};
