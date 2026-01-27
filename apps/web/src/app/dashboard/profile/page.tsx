"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, UpdateProfileRequest } from "@/hooks/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserGender } from "@/types";

import { PhoneInput } from "@/components/ui/phone-input";
import { OTPVerificationModal } from "@/components/dashboard/otp-verification-modal";
import { usePhoneVerification } from "@/hooks/usePhoneVerification";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { SessionList } from "@/components/dashboard/session-list";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobileNumber: z.string().optional(),
  gender: z.nativeEnum(UserGender).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { updateProfile, isUpdating } = useProfile();
  const { t } = useLanguage();
  const { sendOtp, isSendingOtp } = usePhoneVerification();
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const userData = user?.data as any; // Temporaryany cast until types are sync
  const isVerified = userData?.verification?.mobileNumber;

  const defaultValues = React.useMemo(() => ({
    firstName: user?.data.firstName || "",
    lastName: user?.data.lastName || "",
    mobileNumber: userData?.mobileNumber || "",
    gender: user?.data.gender || UserGender.MALE,
  }), [user?.data.firstName, user?.data.lastName, userData?.mobileNumber, user?.data.gender]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onChange",
  });

  // Effect to reset form only when user data changes meaningfully (e.g. initial load)
  // We avoid resetting on every render to prevent "refilling" while typing if something triggers re-renders
  React.useEffect(() => {
    if (user?.data && !form.formState.isDirty) {
        form.reset({
            firstName: user.data.firstName,
            lastName: user.data.lastName,
            mobileNumber: userData.mobileNumber || "",
            gender: user.data.gender,
        });
    }
  }, [user?.data?.firstName, user?.data?.lastName, userData?.mobileNumber, user?.data?.gender, form]);

  function onSubmit(data: ProfileFormValues) {
    updateProfile(data);
  }

  const handleVerifyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const mobileNumber = form.getValues("mobileNumber");
    if (!mobileNumber) return;
    
    // Save profile first if number changed? 
    // Ideally we assume number is saved from "Save Changes" 
    // But to verify, we must ensure backend has the number.
    // Let's assume user must save first OR we blindly send OTP to the number in the input 
    // (which calls /send-otp and UPDATES number in backend too as per my controller logic).
    
    try {
        await sendOtp({ mobileNumber });
        setIsOtpModalOpen(true);
    } catch (err) {
        // Error toast handled in hook
    }
  };


  return (
    <div className="container max-w-2xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("PROFILE.PERSONAL_INFO")}</CardTitle>
          <CardDescription>
            {t("SETTINGS.PROFILE_DESC")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("AUTH.LABEL_FIRST_NAME")}</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("AUTH.LABEL_LAST_NAME")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email">{t("AUTH.LABEL_EMAIL")}</Label>
                        {user?.data.verification?.email ? (
                            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                {t("PROFILE.VERIFIED_STATUS")}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                <AlertCircle className="h-3 w-3" />
                                {t("PROFILE.UNVERIFIED_STATUS")}
                            </div>
                        )}
                    </div>
                    <Input id="email" value={user?.data.email} disabled />
                    <p className="text-[0.8rem] text-muted-foreground">
                      {t("PROFILE.EMAIL_MANAGED")}
                    </p>
                 </div>
                 
                 <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                          <FormLabel>{t("PROFILE.LABEL_PHONE")}</FormLabel>
                          {isVerified && field.value === userData?.mobileNumber ? (
                              <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {t("PROFILE.VERIFIED_STATUS")}
                              </div>
                          ) : field.value ? (
                              <div 
                                className="flex items-center gap-1 text-xs text-red-600 font-medium cursor-pointer hover:underline"
                                onClick={handleVerifyClick}
                              >
                                  <AlertCircle className="h-3 w-3" />
                                  {t("PROFILE.VERIFY_NOW")}
                              </div>
                          ) : null}
                      </div>
                      <div className="flex gap-2 items-start">
                        <FormControl>
                          <PhoneInput placeholder="+84..." {...field} className="flex-1" />
                        </FormControl>
                         {/* Button removed as Badge handles action/status display cleaner */}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("PROFILE.LABEL_GENDER")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserGender.MALE}>
                             <span className="flex items-center gap-2">🚹 {t("PROFILE.GENDER_OPTIONS.MALE")}</span>
                        </SelectItem>
                        <SelectItem value={UserGender.FEMALE}>
                            <span className="flex items-center gap-2">🚺 {t("PROFILE.GENDER_OPTIONS.FEMALE")}</span>
                        </SelectItem>
                        <SelectItem value={UserGender.OTHER}>
                            <span className="flex items-center gap-2">👤 {t("PROFILE.GENDER_OPTIONS.OTHER")}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? t("COMMON.LOADING") : t("COMMON.BTN_SAVE_CHANGES")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <SessionList />
      <OTPVerificationModal 
        isOpen={isOtpModalOpen} 
        onClose={() => setIsOtpModalOpen(false)} 
        mobileNumber={form.getValues("mobileNumber") || ""}
      />
    </div>
  );
}
