import React from "react";
import { View, Modal, TouchableOpacity, ScrollView } from "react-native";
import { AppText, AppInput, AppButton, Icon } from "@/components/ui";
import { ENUM_REPORT_SEVERITY } from "@repo/shared";
import { useTranslation } from "react-i18next";

interface ReportEditModalProps {
  editingReport: any;
  setEditingReport: (report: any | null) => void;
  isSubmitting: boolean;
  handleEditSave: () => void;
}

export const ReportEditModal = ({
  editingReport,
  setEditingReport,
  isSubmitting,
  handleEditSave,
}: ReportEditModalProps) => {
  const { t } = useTranslation();

  const formatCoordinates = (coords: [number, number]) => {
    if (!coords || coords.length < 2) return t('COMMON.UNKNOWN_LOCATION') || "Unknown location";
    return `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
  };

  const updateReport = (updates: any) => {
    setEditingReport((prev: any) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <Modal visible={!!editingReport} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-neutrals900 h-[85%] rounded-t-3xl p-6">
          <View className="flex-row justify-between mb-6">
            <AppText variant="heading4">{t('REPORT.EDIT.TITLE')}</AppText>
            <TouchableOpacity onPress={() => setEditingReport(null)}>
              <Icon name="X" className="w-6 h-6" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hiển thị tọa độ dạng Text Read-only để user biết vị trí */}
            <View className="bg-gray-50 p-3 rounded-xl mb-4 flex-row items-center">
              <Icon name="MapPin" className="w-4 h-4 text-gray-400 mr-2" />
              <AppText className="text-gray-500 font-sans-medium">
                {t('REPORT.EDIT.LOCATION')}:{" "}
                {editingReport && formatCoordinates(editingReport.location.coordinates)}
              </AppText>
            </View>

            <AppText className="font-bold mb-2">{t('REPORT.EDIT.DESCRIPTION')}</AppText>
            <AppInput
              value={editingReport?.notes}
              onChangeText={(t) => updateReport({ notes: t })}
              variant="textarea"
              className="h-32"
            />

            <AppText className="font-bold mt-4 mb-2">{t('REPORT.EDIT.PEOPLE_COUNT')}</AppText>
            <AppInput
              value={editingReport?.peopleCount?.toString()}
              onChangeText={(t) => updateReport({ peopleCount: parseInt(t) || 0 })}
              keyboardType="numeric"
            />

            <AppText className="font-bold mt-4 mb-2">{t('REPORT.EDIT.SEVERITY')}</AppText>
            <View className="flex-row gap-2 flex-wrap">
              {Object.values(ENUM_REPORT_SEVERITY).map((sev) => (
                <TouchableOpacity
                  key={sev}
                  onPress={() => updateReport({ severity: sev })}
                  className={`px-3 py-2 rounded-lg border ${editingReport?.severity === sev ? "bg-blue-600 border-blue-600" : "border-gray-200"}`}
                >
                  <AppText
                    className={
                      editingReport?.severity === sev
                        ? "text-white"
                        : "text-gray-600"
                    }
                  >
                    {t(`REPORT.SEVERITY.${sev}`)}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <AppButton
            onPress={handleEditSave}
            disabled={isSubmitting}
            className="mt-4 bg-blue-600 rounded-xl"
            textClassname="text-white font-bold"
          >
            {isSubmitting ? t('COMMON.LOADING') : t('REPORT.EDIT.BTN_CONFIRM')}
          </AppButton>
        </View>
      </View>
    </Modal>
  );
};
