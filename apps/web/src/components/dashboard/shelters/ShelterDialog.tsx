"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

enum ShelterType {
  EVACUATION = "EVACUATION",
  WAREHOUSE = "WAREHOUSE",
  MEDICAL = "MEDICAL",
  TEMPORARY = "TEMPORARY"
}

enum ShelterStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  FULL = "FULL",
  CLOSED = "CLOSED"
}

interface ShelterFormData {
  name: string;
  type: ShelterType;
  status?: ShelterStatus;
  address: string;
  regionId: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  currentOccupancy?: number;
  contactPerson?: string;
  contactPhone?: string;
  description?: string;
  facilities?: {
    electricity?: boolean;
    water?: boolean;
    medical?: boolean;
    kitchen?: boolean;
    restroom?: boolean;
  };
}

interface ShelterDialogProps {
  open: boolean;
  onClose: () => void;
  shelter?: any;
}

export function ShelterDialog({ open, onClose, shelter }: ShelterDialogProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [facilities, setFacilities] = useState({
    electricity: false,
    water: false,
    medical: false,
    kitchen: false,
    restroom: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShelterFormData>();

  const type = watch("type");

  useEffect(() => {
    if (shelter) {
      setValue("name", shelter.name);
      setValue("type", shelter.type);
      setValue("status", shelter.status);
      setValue("address", shelter.address);
      setValue("regionId", shelter.regionId);
      setValue("latitude", shelter.location?.coordinates[1]);
      setValue("longitude", shelter.location?.coordinates[0]);
      setValue("capacity", shelter.capacity);
      setValue("currentOccupancy", shelter.currentOccupancy);
      setValue("contactPerson", shelter.contactPerson);
      setValue("contactPhone", shelter.contactPhone);
      setValue("description", shelter.description);
      if (shelter.facilities) {
        setFacilities(shelter.facilities);
      }
    } else {
      reset();
      setFacilities({
        electricity: false,
        water: false,
        medical: false,
        kitchen: false,
        restroom: false,
      });
    }
  }, [shelter, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ShelterFormData) => {
      const payload = {
        name: data.name,
        type: data.type,
        status: data.status,
        address: data.address,
        regionId: data.regionId,
        location: {
          type: "Point",
          coordinates: [data.longitude, data.latitude],
        },
        capacity: data.capacity ? Number(data.capacity) : undefined,
        currentOccupancy: data.currentOccupancy ? Number(data.currentOccupancy) : undefined,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        description: data.description,
        facilities,
      };

      if (shelter) {
        await api.put(`/admin/shelter/${shelter._id}`, payload);
      } else {
        await api.post("/admin/shelter/create", payload);
      }
    },
    onSuccess: () => {
      toast.success(
        shelter ? t("SHELTERS.UPDATE_SUCCESS") : t("SHELTERS.CREATE_SUCCESS")
      );
      queryClient.invalidateQueries({ queryKey: ["shelters"] });
      onClose();
    },
    onError: () => {
      toast.error(
        shelter ? t("SHELTERS.UPDATE_ERROR") : t("SHELTERS.CREATE_ERROR")
      );
    },
  });

  const onSubmit = (data: ShelterFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {shelter ? t("SHELTERS.EDIT_TITLE") : t("SHELTERS.CREATE_TITLE")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">{t("SHELTERS.FIELD_NAME")} *</Label>
              <Input
                id="name"
                {...register("name", { required: true })}
                placeholder={t("SHELTERS.FIELD_NAME_PLACEHOLDER")}
              />
              {errors.name && (
                <span className="text-sm text-destructive">
                  {t("VALIDATION.REQUIRED", { field: t("SHELTERS.FIELD_NAME") })}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="type">{t("SHELTERS.FIELD_TYPE")} *</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue("type", value as ShelterType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("SHELTERS.SELECT_TYPE")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVACUATION">{t("SHELTERS.TYPE.EVACUATION")}</SelectItem>
                  <SelectItem value="WAREHOUSE">{t("SHELTERS.TYPE.WAREHOUSE")}</SelectItem>
                  <SelectItem value="MEDICAL">{t("SHELTERS.TYPE.MEDICAL")}</SelectItem>
                  <SelectItem value="TEMPORARY">{t("SHELTERS.TYPE.TEMPORARY")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shelter && (
              <div>
                <Label htmlFor="status">{t("SHELTERS.FIELD_STATUS")}</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as ShelterStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t("SHELTERS.STATUS.ACTIVE")}</SelectItem>
                    <SelectItem value="INACTIVE">{t("SHELTERS.STATUS.INACTIVE")}</SelectItem>
                    <SelectItem value="FULL">{t("SHELTERS.STATUS.FULL")}</SelectItem>
                    <SelectItem value="CLOSED">{t("SHELTERS.STATUS.CLOSED")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="address">{t("SHELTERS.FIELD_ADDRESS")} *</Label>
              <Input
                id="address"
                {...register("address", { required: true })}
                placeholder={t("SHELTERS.FIELD_ADDRESS_PLACEHOLDER")}
              />
            </div>

            <div>
              <Label htmlFor="regionId">{t("SHELTERS.FIELD_REGION")} *</Label>
              <Input
                id="regionId"
                {...register("regionId", { required: true })}
                placeholder="VN-SG"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="latitude">{t("SHELTERS.FIELD_LAT")} *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register("latitude", { required: true, valueAsNumber: true })}
                  placeholder="10.762622"
                />
              </div>
              <div>
                <Label htmlFor="longitude">{t("SHELTERS.FIELD_LNG")} *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register("longitude", { required: true, valueAsNumber: true })}
                  placeholder="106.660172"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="capacity">{t("SHELTERS.FIELD_CAPACITY")}</Label>
              <Input
                id="capacity"
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                placeholder="100"
              />
            </div>

            <div>
              <Label htmlFor="currentOccupancy">{t("SHELTERS.FIELD_OCCUPANCY")}</Label>
              <Input
                id="currentOccupancy"
                type="number"
                {...register("currentOccupancy", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="contactPerson">{t("SHELTERS.FIELD_CONTACT_PERSON")}</Label>
              <Input
                id="contactPerson"
                {...register("contactPerson")}
                placeholder={t("SHELTERS.FIELD_CONTACT_PERSON_PLACEHOLDER")}
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">{t("SHELTERS.FIELD_CONTACT_PHONE")}</Label>
              <Input
                id="contactPhone"
                {...register("contactPhone")}
                placeholder="+84 123 456 789"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">{t("SHELTERS.FIELD_DESCRIPTION")}</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={t("SHELTERS.FIELD_DESCRIPTION_PLACEHOLDER")}
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label>{t("SHELTERS.FIELD_FACILITIES")}</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {Object.entries(facilities).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) =>
                        setFacilities((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                    <label
                      htmlFor={key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t(`SHELTERS.FACILITIES.${key.toUpperCase()}`)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("COMMON.CANCEL")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {shelter ? t("COMMON.SAVE") : t("SHELTERS.CREATE")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
