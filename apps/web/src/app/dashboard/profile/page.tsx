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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.data.firstName || "",
      lastName: user?.data.lastName || "",
      mobileNumber: (user?.data as any)?.mobileNumber || "",
      gender: user?.data.gender || UserGender.MALE,
    },
  });

  function onSubmit(data: ProfileFormValues) {
    updateProfile(data);
  }

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
                    <Label htmlFor="email">{t("AUTH.LABEL_EMAIL")}</Label>
                    <Input id="email" value={user?.data.email} disabled />
                    <p className="text-[0.8rem] text-muted-foreground">
                      Email address is managed by administrator.
                    </p>
                 </div>
                 
                 <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("PROFILE.LABEL_PHONE")}</FormLabel>
                      <FormControl>
                        <Input placeholder="+1..." {...field} />
                      </FormControl>
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
                        <SelectItem value={UserGender.MALE}>{t("PROFILE.GENDER_OPTIONS.MALE")}</SelectItem>
                        <SelectItem value={UserGender.FEMALE}>{t("PROFILE.GENDER_OPTIONS.FEMALE")}</SelectItem>
                        <SelectItem value={UserGender.OTHER}>{t("PROFILE.GENDER_OPTIONS.OTHER")}</SelectItem>
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
    </div>
  );
}
