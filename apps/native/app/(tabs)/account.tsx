import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme, setToken } from "@/store/slices/appSlice"; // Import setToken để logout

// Components
import {
  AppText,
  AppInput,
  AppButton,
  Icon,
  Avatar,
  Select,
  Badge,
  Switch,
} from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { apiService } from "@/services/api.service"; // 👇 Import API Service

// Interface cho response từ API
interface UserProfileResponse {
  data: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    gender: string;
    isVolunteer: boolean;
    isVerified: boolean; // Có thể là verify account chung
    role: string;
    verification: {
      email: boolean;
      mobileNumber: boolean;
    };
    // ... các trường khác nếu cần
  };
}

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.app);
  const colors = useColors();
  const { showSuccess, showInfo, showError } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true); // Thêm state loading

  // State User
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "", // API hiện tại chưa trả về phone, để trống hoặc mock
    gender: "other",
    role: "user",
    isEmailVerified: false,
    isVolunteer: false,
  });

  // 👇 Fetch Profile khi component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<UserProfileResponse>(
        "/shared/user/profile",
      );
      const data = response.data; // Dữ liệu user nằm trong key 'data'

      // Mapping dữ liệu từ API sang State
      setUserData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: "", // API chưa có phone, tạm để trống
        gender: data.gender ? data.gender.toLowerCase() : "other", // API trả về UPPERCASE, convert sang lowercase
        role: mapRole(data.role), // Helper map role string
        isEmailVerified: data.verification?.email || false,
        isVolunteer: data.isVolunteer || false,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      showError("Error", "Could not load user profile.");
    } finally {
      setLoading(false);
    }
  };

  // Helper map role từ API sang value của Select
  const mapRole = (apiRole: string): string => {
    if (!apiRole) return "user";
    const normalized = apiRole.toLowerCase();
    if (normalized.includes("admin")) return "admin";
    if (normalized.includes("volunteer")) return "volunteer";
    return "user";
  };

  const roleOptions = [
    { label: "Normal User", value: "user" },
    { label: "Volunteer", value: "volunteer" },
    { label: "Admin", value: "admin" },
  ];

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];

  const handleLogout = () => {
    // Xóa token trong Redux -> App sẽ tự redirect về Login nhờ _layout
    dispatch(setToken(null));
  };

  const handleSaveProfile = async () => {
    // Logic gọi API update profile sẽ đặt ở đây
    setIsEditing(false);
    showSuccess(
      "Profile Updated",
      "Your information has been saved locally (Demo)."
    );
    // await apiService.put('/shared/user/profile', { ...userData });
  };

  const handleUpdateField = (field: string, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVerifyEmail = () => {
    showInfo("Verification Sent", `Email sent to ${userData.email}`);
    setTimeout(() => {
      setUserData((prev) => ({ ...prev, isEmailVerified: true }));
      showSuccess("Success", "Email verified successfully!");
    }, 2000);
  };

  const handleToggleVolunteer = (value: boolean) => {
    if (!userData.isEmailVerified && value === true) {
      Alert.alert(
        "Verification Required",
        "You must verify your email address before registering as a volunteer.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Verify Now", onPress: handleVerifyEmail },
        ]
      );
      return;
    }

    setUserData((prev) => ({
      ...prev,
      isVolunteer: value,
      role: value ? "volunteer" : "user",
    }));
    if (value) {
      showSuccess(
        "Welcome Volunteer",
        "You are now registered to receive relief requests."
      );
    }
  };

  const renderInfoRow = (label: string, field: keyof typeof userData, placeholder: string = "", isSelect: boolean = false) => {
    const value = userData[field] as string;
    const hasValue = value && value.trim().length > 0;

    return (
      <View style={styles.infoRow}>
        <AppText style={styles.label}>{label}</AppText>
        
        {isEditing ? (
          isSelect ? (
            <Select 
              options={genderOptions}
              value={value}
              onValueChange={(val:any) => handleUpdateField(field, val.toString())}
              placeholder={placeholder}
              size="sm"
            />
          ) : (
            <AppInput
              value={value}
              onChangeText={(val) => handleUpdateField(field, val)}
              placeholder={placeholder}
              style={[styles.inputEdit, { color: colors.foreground, borderColor: colors.border }]}
              containerClassName="border-0 p-0"
            />
          )
        ) : (
          <AppText 
            style={[
              styles.valueText, 
              // Nếu không có giá trị -> Màu xám + Nghiêng
              { 
                color: hasValue ? colors.foreground : colors.neutrals400,
                fontStyle: hasValue ? 'normal' : 'italic',
                fontWeight: hasValue ? '500' : '400'
              }
            ]}
          >
            {hasValue 
              ? (field === 'gender' ? (value.charAt(0).toUpperCase() + value.slice(1)) : value) 
              : (t("NOT_UPDATED") || "Chưa cập nhật") // Text hiển thị khi trống
            }
          </AppText>
        )}
      </View>
    );
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { borderBottomColor: theme === "dark" ? "#333" : "#f1f5f9" },
      ]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Icon name={icon as any} className="w-5 h-5 text-neutrals400" />
        <AppText style={[styles.menuText, { color: colors.foreground }]}>
          {title}
        </AppText>
      </View>
      <Icon name="ChevronRight" className="w-5 h-5 text-neutrals300" />
    </TouchableOpacity>
  );

  // Render Loading nếu đang fetch data
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* HEADER */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.background,
            borderBottomColor: theme === "dark" ? "#333" : "#e5e7eb",
          },
        ]}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerIconPlaceholder} />
            <View style={styles.headerTitleContainer}>
              <AppText
                style={[styles.headerTitle, { color: colors.foreground }]}
              >
                Account
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => dispatch(toggleTheme())}
              style={[
                styles.iconButton,
                { backgroundColor: theme === "dark" ? "#333" : "#f3f4f6" },
              ]}
            >
              <Icon
                name={theme === "dark" ? "Sun" : "Moon"}
                className={
                  "w-5 h-5 " +
                  theme === "dark" ? "text-yellow-400" : "text-slate-600"
                }
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. PROFILE INFORMATION */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <AppText
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              Profile Information
            </AppText>
            <TouchableOpacity
              onPress={() =>
                isEditing ? handleSaveProfile() : setIsEditing(true)
              }
            >
              <AppText style={{ color: "#2563eb", fontWeight: "600" }}>
                {isEditing ? "Save" : "Edit"}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.profileHeader}>
            <Avatar
              text={`${userData.firstName} ${userData.lastName}`}
              size="xl"
              className="bg-blue-100"
              textClassName="text-blue-600 text-2xl"
            />
            <View style={styles.profileNameContainer}>
              {isEditing ? (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      value={userData.firstName}
                      onChangeText={(v) => handleUpdateField("firstName", v)}
                      placeholder="First Name"
                      style={{ height: 40, fontSize: 14 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      value={userData.lastName}
                      onChangeText={(v) => handleUpdateField("lastName", v)}
                      placeholder="Last Name"
                      style={{ height: 40, fontSize: 14 }}
                    />
                  </View>
                </View>
              ) : (
                <AppText
                  style={[styles.profileName, { color: colors.foreground }]}
                >
                  {userData.firstName} {userData.lastName}
                </AppText>
              )}

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      theme === "dark" ? "rgba(37, 99, 235, 0.2)" : "#dbeafe",
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.roleText,
                    { color: theme === "dark" ? "#93c5fd" : "#2563eb" },
                  ]}
                >
                  {userData.role.toUpperCase()}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.infoContainer}>
            {/* Email Row */}
            <View style={styles.infoRow}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <AppText style={styles.label}>Email</AppText>
                {userData.isEmailVerified ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon
                      name="CircleCheck"
                      className="w-4 h-4 text-green-500"
                    />
                    <AppText
                      style={{
                        fontSize: 12,
                        color: "#22c55e",
                        fontWeight: "600",
                      }}
                    >
                      Verified
                    </AppText>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Badge
                      variant="warning"
                      size="sm"
                      className="bg-yellow-50 dark:bg-yellow-900/30"
                    >
                      <AppText
                        style={{
                          color: "#ca8a04",
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        Unverified
                      </AppText>
                    </Badge>
                    <TouchableOpacity
                      onPress={handleVerifyEmail}
                      style={{
                        backgroundColor: "#2563eb",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <AppText
                        style={{
                          color: "white",
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        Verify
                      </AppText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <AppText
                style={[
                  styles.valueText,
                  { color: colors.neutrals400, marginTop: 4 },
                ]}
              >
                {userData.email}
              </AppText>
            </View>

            {renderInfoRow("Phone", "phone", "Enter phone number")}
            {renderInfoRow("Gender", "gender", "Select gender", true)}
          </View>
        </View>

        {/* 2. VOLUNTEER SETTINGS */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingVertical: 16,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, marginRight: 16 }}>
              <AppText
                style={[
                  styles.cardTitle,
                  { color: colors.foreground, marginBottom: 4 },
                ]}
              >
                I am a Volunteer
              </AppText>
              <AppText
                style={{
                  fontSize: 13,
                  color: colors.neutrals400,
                  lineHeight: 18,
                }}
              >
                Mark yourself as a volunteer to receive relief requests.
                {!userData.isEmailVerified && (
                  <AppText style={{ color: "#ef4444", fontWeight: "600" }}>
                    {" "}
                    (Requires Verified Email)
                  </AppText>
                )}
              </AppText>
            </View>

            <View style={{ opacity: userData.isEmailVerified ? 1 : 0.5 }}>
              <Switch
                value={userData.isVolunteer}
                onValueChange={handleToggleVolunteer}
                disabled={false}
              />
            </View>
          </View>
        </View>

        {/* 3. DEMO ROLE CARD */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <AppText
            style={[
              styles.sectionTitle,
              { color: colors.foreground, marginBottom: 12 },
            ]}
          >
            Developer Options
          </AppText>
          <AppText style={styles.label}>Force User Role</AppText>
          <View style={{ marginTop: 8 }}>
            <Select
              options={roleOptions}
              value={userData.role}
              onValueChange={(val:any) => handleUpdateField("role", val.toString())}
              placeholder="Select Role"
            />
          </View>
        </View>

        {/* 4. MENU LIST */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingVertical: 8,
              paddingHorizontal: 0,
            },
          ]}
        >
          {renderMenuItem("Settings", "Settings", () => {})}
          {renderMenuItem("Info", "About", () => router.push("/About"))}
          {renderMenuItem("CircleQuestionMark", "Help & Support", () => {})}
        </View>

        {/* 5. LOGOUT */}
        <AppButton
          variant="ghost"
          onPress={handleLogout}
          style={{
            backgroundColor: "#ef4444",
            height: 50,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 8,
            marginBottom: 30,
            flexDirection: "row",
            gap: 8,
          }}
          textClassname="text-white font-sans-bold text-lg"
          icon={<Icon name="LogOut" className="text-white w-5 h-5" />}
        >
          Logout
        </AppButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerContent: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerIconPlaceholder: { width: 40 },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "SourceSans3-Bold",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { padding: 16, paddingBottom: 40, paddingTop: 16 },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileNameContainer: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  roleText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  infoContainer: { gap: 16 },
  infoRow: { gap: 4 },
  label: { fontSize: 13, color: "#9ca3af", fontWeight: "500" },
  valueText: { fontSize: 15, fontWeight: "500" },
  inputEdit: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuText: { fontSize: 15, fontWeight: "500" },
});
