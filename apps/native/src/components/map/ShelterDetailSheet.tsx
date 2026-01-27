import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Linking, Platform, TouchableOpacity, ScrollView } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useColors } from "@/hooks/useColors";
import { AppButton as Button, Icon } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { Shelter } from "@/services/shelter.service";
import { 
    MapPin, 
    Phone, 
    Navigation, 
    Users, 
    Info, 
    Warehouse, 
    Zap, 
    Droplet, 
    HeartPulse, 
    Utensils, 
    Tent 
} from "lucide-react-native";

interface ShelterDetailSheetProps {
  shelter: Shelter | null;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

export const ShelterDetailSheet: React.FC<ShelterDetailSheetProps> = ({
  shelter,
  onClose,
  userLocation,
}) => {
  const { t } = useTranslation();
  const colors = useColors();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["35%", "80%"], []);

  useEffect(() => {
    if (shelter) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [shelter]);

  const handleSheetChanges = (index: number) => {
    if (index === -1) {
      onClose();
    }
  };

  const openDirections = () => {
    if (!shelter) return;
    const [lng, lat] = shelter.location.coordinates;
    const label = encodeURIComponent(shelter.name);
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });

    if (url) Linking.openURL(url);
  };

  const callContact = () => {
    if (shelter?.contactPhone) {
        Linking.openURL(`tel:${shelter.contactPhone}`);
    }
  };

  if (!shelter) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.header}>
            <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                    {shelter.name}
                </Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(shelter.status) }]}>
                    <Text style={styles.badgeText}>
                        {t(`SHELTERS.STATUS.${shelter.status}`)}
                    </Text>
                </View>
            </View>
            <Text style={[styles.type, { color: colors.neutrals200 }]}>
                {t(`SHELTERS.TYPE.${shelter.type}`)}
            </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
            <Button
                variant="primary"
                size="sm"
                onPress={openDirections}
                icon={<Navigation size={18} color="white" />}
                style={{ flex: 1 }}
            >
                {t("COMMON.DIRECTIONS")}
            </Button>
            
            {shelter.contactPhone && (
                 <Button
                    variant="outline"
                    size="sm"
                    onPress={callContact}
                    icon={<Phone size={18} color={colors.foreground} />}
                    style={{ flex: 1 }}
                >
                    {t("COMMON.CALL")}
                </Button>
            )}
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* Info Rows */}
        <View style={styles.infoSection}>
            <InfoRow 
                icon={<MapPin size={20} color={colors.neutrals500} />}
                label={t("SHELTERS.FIELD_ADDRESS")}
                value={shelter.address}
                colors={colors}
            />
            <InfoRow 
                icon={<Users size={20} color={colors.neutrals500} />}
                label={t("SHELTERS.FIELD_CAPACITY")}
                value={`${shelter.currentOccupancy || 0} / ${shelter.capacity || "∞"}`}
                colors={colors}
            />
             <InfoRow 
                icon={<Info size={20} color={colors.neutrals500} />}
                label={t("SHELTERS.FIELD_DESCRIPTION")}
                value={shelter.description || t("COMMON.NO_DESCRIPTION")}
                colors={colors}
            />
        </View>

        {/* Facilities */}
        {shelter.facilities && (
            <View style={styles.facilitiesSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {t("SHELTERS.FIELD_FACILITIES")}
                </Text>
                <View style={styles.facilitiesGrid}>
                    <FacilityItem 
                        icon={<Zap size={20} color={shelter.facilities.electricity ? "#EAB308" : colors.border} />}
                        label={t("SHELTERS.FACILITIES.ELECTRICITY")}
                        active={shelter.facilities.electricity}
                        colors={colors}
                    />
                    <FacilityItem 
                         icon={<Droplet size={20} color={shelter.facilities.water ? "#3B82F6" : colors.border} />}
                        label={t("SHELTERS.FACILITIES.WATER")}
                        active={shelter.facilities.water}
                        colors={colors}
                    />
                     <FacilityItem 
                         icon={<HeartPulse size={20} color={shelter.facilities.medical ? "#EF4444" : colors.border} />}
                        label={t("SHELTERS.FACILITIES.MEDICAL")}
                        active={shelter.facilities.medical}
                        colors={colors}
                    />
                     <FacilityItem 
                         icon={<Utensils size={20} color={shelter.facilities.kitchen ? "#F97316" : colors.border} />}
                        label={t("SHELTERS.FACILITIES.KITCHEN")}
                        active={shelter.facilities.kitchen}
                        colors={colors}
                    />
                     <FacilityItem 
                         icon={<Tent size={20} color={shelter.facilities.restroom ? "#8B5CF6" : colors.border} />}
                        label={t("SHELTERS.FACILITIES.RESTROOM")}
                        active={shelter.facilities.restroom}
                        colors={colors}
                    />
                </View>
            </View>
        )}

        <View style={{ height: 40 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const InfoRow = ({ icon, label, value, colors }: any) => (
    <View style={styles.infoRow}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
    </View>
);

const FacilityItem = ({ icon, label, active, colors }: any) => (
    <View style={[
        styles.facilityItem, 
        { 
            backgroundColor: active ? colors.background : colors.gray[100],
            opacity: active ? 1 : 0.5,
            borderColor: active ? colors.border : 'transparent',
            borderWidth: active ? 1 : 0
        }
    ]}>
        {icon}
        <Text style={[styles.facilityLabel, { color: colors.text }]}>{label}</Text>
    </View>
);

const getStatusColor = (status: string) => {
    switch (status) {
        case "ACTIVE": return "#10B981";
        case "FULL": return "#EF4444";
        case "CLOSED": return "#6B7280";
        default: return "#F59E0B";
    }
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  type: {
      fontSize: 14,
  },
  badge: {
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 8,
     marginLeft: 8,
  },
  badgeText: {
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  separator: {
    height: 1,
    width: "100%",
    marginBottom: 20,
  },
  infoSection: {
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 32,
    alignItems: "center", // Center icon horizontally
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
      flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  facilitiesSection: {
      marginBottom: 20,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
  },
  facilitiesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
  },
  facilityItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      borderRadius: 8,
      gap: 6,
      minWidth: "45%",
  },
  facilityLabel: {
      fontSize: 14,
      fontWeight: "500",
  }
});
