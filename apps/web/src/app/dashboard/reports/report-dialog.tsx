"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import { ReportType, ReportSeverity } from "@/types";
import { useReports, CreateReportRequest } from "@/hooks/useReports";

const formSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: z.nativeEnum(ReportType),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  regionId: z.string().min(1, "Region ID is required"),
  notes: z.string().optional(),
  severity: z.nativeEnum(ReportSeverity).optional(),
  peopleCount: z.coerce.number().min(0).optional(),
  // address: z.string().optional(), // Backend might geocode or just store coords? DTO shows address in response but not CreateRequest explicitly, wait check ReportCreateRequestDto again. 
  // ReportCreateRequestDto doesn't have address field?
  // Let's check. DTO had: coordinates, type, notes, severity, peopleCount, isPublic, regionId.
  // It does NOT have address.
});

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ open, onOpenChange }: ReportDialogProps) {
  const { createReport, isCreating } = useReports({ page: 1 }); // Dummy params

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      userId: "",
      type: ReportType.OTHER,
      lat: 0,
      lng: 0,
      regionId: "vn-dn-hc", // Default placeholder
      notes: "",
      severity: ReportSeverity.MEDIUM,
      peopleCount: 1,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const createData: CreateReportRequest = {
      userId: values.userId,
      type: values.type,
      coordinates: [values.lng, values.lat],
      regionId: values.regionId,
      notes: values.notes,
      severity: values.severity,
      peopleCount: values.peopleCount,
      isPublic: true,
    };

    createReport(createData, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Report</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID (Reporter)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter User ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ReportType).map((type) => (
                           <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ReportSeverity).map((sev) => (
                           <SelectItem key={sev} value={sev}>{sev}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Latitude" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Longitude" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="regionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. vn-dn-hc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="peopleCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>People Count</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Report
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
