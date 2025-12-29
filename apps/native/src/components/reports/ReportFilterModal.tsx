import React from "react";
import { View, Modal, TouchableOpacity, ScrollView } from "react-native";
import { AppText, AppButton, Icon } from "@/components/ui";

interface ReportFilterModalProps {
  visible: boolean;
  onClose: () => void;
  tempTypeFilter: string;
  setTempTypeFilter: (val: string) => void;
  tempStatusFilter: string;
  setTempStatusFilter: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
  TYPE_FILTERS: { label: string; value: string }[];
  STATUS_FILTERS: { label: string; value: string }[];
}

export const ReportFilterModal = ({
  visible,
  onClose,
  tempTypeFilter,
  setTempTypeFilter,
  tempStatusFilter,
  setTempStatusFilter,
  onApply,
  onReset,
  TYPE_FILTERS,
  STATUS_FILTERS,
}: ReportFilterModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-neutrals900 h-[70%] rounded-t-3xl flex-col">
          <View className="p-4 border-b border-gray-100 flex-row justify-between">
            <AppText className="font-bold text-lg">Filters</AppText>
            <TouchableOpacity onPress={onClose}>
              <Icon name="X" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <AppText className="font-bold text-gray-500 mb-3">
              REPORT TYPE
            </AppText>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {TYPE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setTempTypeFilter(f.value)}
                  className={`px-4 py-2 rounded-full border ${tempTypeFilter === f.value ? "bg-emerald-500 border-emerald-500" : "border-gray-200"}`}
                >
                  <AppText
                    className={
                      tempTypeFilter === f.value
                        ? "text-white"
                        : "text-gray-700"
                    }
                  >
                    {f.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <AppText className="font-bold text-gray-500 mb-3">STATUS</AppText>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setTempStatusFilter(f.value)}
                  className={`px-4 py-2 rounded-full border ${tempStatusFilter === f.value ? "bg-blue-500 border-blue-500" : "border-gray-200"}`}
                >
                  <AppText
                    className={
                      tempStatusFilter === f.value
                        ? "text-white"
                        : "text-gray-700"
                    }
                  >
                    {f.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View className="p-4 border-t border-gray-100 flex-row gap-3">
            <AppButton
              variant="outline"
              className="flex-1 rounded-xl"
              onPress={onReset}
            >
              Reset
            </AppButton>
            <AppButton
              className="flex-1 bg-emerald-500 rounded-xl"
              textClassname="text-white font-bold"
              onPress={onApply}
            >
              Apply
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};
