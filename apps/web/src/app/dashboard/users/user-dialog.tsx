"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UserListResponse, UserGender, UserRole } from "@/types";
import { useUsers, CreateUserRequest, UpdateUserRequest } from "@/hooks/useUsers";
import { ENUM_USER_ROLE } from "@repo/shared";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.nativeEnum(UserGender),
  mobileNumber: z.string().optional(),
  role: z.nativeEnum(ENUM_USER_ROLE).optional(),
});

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserListResponse | null; // If null, it's create mode
  currentUserRole: UserRole;
}

export function UserDialog({ open, onOpenChange, user, currentUserRole }: UserDialogProps) {
  const isEdit = !!user;
  const { createUser, isCreating, updateUser, isUpdating, updateUserRole, isUpdatingRole } = useUsers({ page: 1, limit: 10 }); // Dummy params for hook initialization
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      gender: UserGender.MALE,
      mobileNumber: "",
      role: ENUM_USER_ROLE.USER,
    },
  });

  useEffect(() => {
    if (user) {
      const u = user as any;
      form.reset({
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        gender: u.gender || UserGender.MALE,
        mobileNumber: u.mobileNumber || "",
        role: u.role || ENUM_USER_ROLE.USER,
      });
    } else {
      form.reset({
        email: "",
        firstName: "",
        lastName: "",
        gender: UserGender.MALE,
        mobileNumber: "",
        role: ENUM_USER_ROLE.USER,
      });
    }
  }, [user, form, open]); 
  // Added open as dependency to reset when opening "Create" after "Edit"

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEdit && user) {
      const u = user as any;
      const updateData: UpdateUserRequest = {};

      // Chỉ thêm field nếu giá trị thay đổi
      if (values.email !== u.email) {
        updateData.email = values.email;
      }
      if (values.firstName !== u.firstName) {
        updateData.firstName = values.firstName;
      }
      if (values.lastName !== u.lastName) {
        updateData.lastName = values.lastName;
      }
      if (values.gender !== u.gender) {
        updateData.gender = values.gender;
      }
      
      // Xử lý mobileNumber: chỉ gửi nếu thay đổi và có giá trị
      const oldMobileNumber = u.mobileNumber || "";
      const newMobileNumber = values.mobileNumber?.trim() || "";
      if (newMobileNumber !== oldMobileNumber) {
        if (newMobileNumber !== "") {
          updateData.mobileNumber = newMobileNumber;
        }
        // Nếu xóa số điện thoại (từ có giá trị → empty), không gửi field
      }
      
      const promises = [];
      
      // Chỉ gọi update nếu có field thay đổi
      if (Object.keys(updateData).length > 0) {
        promises.push(new Promise<void>((resolve, reject) => {
            updateUser(
              { id: user._id, data: updateData },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
        }));
      }

      // Check if role changed
      if (values.role && values.role !== user.role) {
          promises.push(new Promise<void>((resolve, reject) => {
              updateUserRole(
                  { id: user._id, role: values.role as UserRole },
                  {
                      onSuccess: () => resolve(),
                      onError: (error) => reject(error),
                  }
              )
          }));
      }

      // Nếu không có thay đổi nào, đóng dialog
      if (promises.length === 0) {
        onOpenChange(false);
        return;
      }

      Promise.all(promises).then(() => {
          onOpenChange(false);
          form.reset();
      }).catch((err) => {
          console.error(err);
      });

    } else {
      const createData: CreateUserRequest = {
        ...values,
        firstName: values.firstName || "",
        lastName: values.lastName || "",
        mobileNumber: values.mobileNumber || "",
      };

      createUser(createData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  const isLoading = isCreating || isUpdating || isUpdatingRole;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("COMMON.EDIT") : t("AUTH.REGISTER_TITLE")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("AUTH.LABEL_EMAIL")}</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PROFILE.LABEL_PHONE")}</FormLabel>
                  <FormControl>
                    <Input placeholder="+84..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PROFILE.LABEL_GENDER")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserGender.MALE}>{t("PROFILE.GENDER_OPTIONS.MALE")}</SelectItem>
                      <SelectItem value={UserGender.FEMALE}>{t("PROFILE.GENDER_OPTIONS.FEMALE")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={currentUserRole !== ENUM_USER_ROLE.SUPER_ADMIN}> 
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value={ENUM_USER_ROLE.USER}>{t("USERS.ROLES.USER")}</SelectItem>
                        <SelectItem value={ENUM_USER_ROLE.VOLUNTEER}>{t("USERS.ROLES.VOLUNTEER")}</SelectItem>
                        <SelectItem value={ENUM_USER_ROLE.ADMIN}>{t("USERS.ROLES.ADMIN")}</SelectItem>
                        <SelectItem value={ENUM_USER_ROLE.SUPER_ADMIN}>{t("USERS.ROLES.SUPER_ADMIN")}</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("COMMON.CANCEL")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? t("COMMON.BTN_SAVE_CHANGES") : t("AUTH.BTN_REGISTER")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
