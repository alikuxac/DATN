"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, MapPin, Users, Package } from "lucide-react";
import { toast } from "sonner";
import { ShelterDialog } from "@/components/dashboard/shelters/ShelterDialog";

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

interface Shelter {
  _id: string;
  name: string;
  type: ShelterType;
  status: ShelterStatus;
  address: string;
  regionId: string;
  capacity?: number;
  currentOccupancy?: number;
  contactPerson?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SheltersPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["shelters", page, search, typeFilter, statusFilter],
    queryFn: async () => {
      const params: any = {
        page,
        limit: 20,
      };
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const { data } = await api.get("/admin/shelter/list", { params });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/shelter/${id}`);
    },
    onSuccess: () => {
      toast.success(t("SHELTERS.DELETE_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: ["shelters"] });
    },
    onError: () => {
      toast.error(t("SHELTERS.DELETE_ERROR"));
    },
  });

  const getStatusBadge = (status: ShelterStatus) => {
    const variants: Record<ShelterStatus, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      FULL: "destructive",
      CLOSED: "outline",
    };
    return (
      <Badge variant={variants[status]}>
        {t(`SHELTERS.STATUS.${status}`)}
      </Badge>
    );
  };

  const getTypeBadge = (type: ShelterType) => {
    const colors: Record<string, string> = {
      EVACUATION: "bg-blue-100 text-blue-800",
      WAREHOUSE: "bg-green-100 text-green-800",
      MEDICAL: "bg-red-100 text-red-800",
      TEMPORARY: "bg-yellow-100 text-yellow-800",
      SCHOOL: "bg-violet-100 text-violet-800",
      COMMUNITY_CENTER: "bg-pink-100 text-pink-800",
      GYM: "bg-teal-100 text-teal-800",
      PAGODA: "bg-purple-100 text-purple-800",
      CHURCH: "bg-indigo-100 text-indigo-800",
      OFFICIAL: "bg-slate-100 text-slate-800",
      OTHER: "bg-zinc-100 text-zinc-800",
    };
    return (
      <Badge className={colors[type] || colors.OTHER}>
        {t(`SHELTERS.TYPE.${type}`)}
      </Badge>
    );
  };

  const shelters = data?.data || [];
  const totalPages = data?._pagination?.totalPage || 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("SHELTERS.TITLE")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("SHELTERS.SUBTITLE")}
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedShelter(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("SHELTERS.CREATE")}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("SHELTERS.SEARCH_PLACEHOLDER")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("SHELTERS.TYPE_FILTER")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("SHELTERS.ALL_TYPES")}</SelectItem>
            <SelectItem value="EVACUATION">{t("SHELTERS.TYPE.EVACUATION")}</SelectItem>
            <SelectItem value="WAREHOUSE">{t("SHELTERS.TYPE.WAREHOUSE")}</SelectItem>
            <SelectItem value="MEDICAL">{t("SHELTERS.TYPE.MEDICAL")}</SelectItem>
            <SelectItem value="TEMPORARY">{t("SHELTERS.TYPE.TEMPORARY")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("SHELTERS.STATUS_FILTER")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("SHELTERS.ALL_STATUSES")}</SelectItem>
            <SelectItem value="ACTIVE">{t("SHELTERS.STATUS.ACTIVE")}</SelectItem>
            <SelectItem value="INACTIVE">{t("SHELTERS.STATUS.INACTIVE")}</SelectItem>
            <SelectItem value="FULL">{t("SHELTERS.STATUS.FULL")}</SelectItem>
            <SelectItem value="CLOSED">{t("SHELTERS.STATUS.CLOSED")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("SHELTERS.COL_NAME")}</TableHead>
                  <TableHead>{t("SHELTERS.COL_TYPE")}</TableHead>
                  <TableHead>{t("SHELTERS.COL_STATUS")}</TableHead>
                  <TableHead>{t("SHELTERS.COL_ADDRESS")}</TableHead>
                  <TableHead>{t("SHELTERS.COL_CAPACITY")}</TableHead>
                  <TableHead>{t("SHELTERS.COL_CONTACT")}</TableHead>
                  <TableHead className="text-right">{t("COMMON.ACTIONS")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shelters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {t("SHELTERS.NO_RESULTS")}
                    </TableCell>
                  </TableRow>
                ) : (
                  shelters.map((shelter: Shelter) => (
                    <TableRow key={shelter._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {shelter.name}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(shelter.type)}</TableCell>
                      <TableCell>{getStatusBadge(shelter.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {shelter.address}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {shelter.currentOccupancy || 0} / {shelter.capacity || "∞"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {shelter.contactPerson && (
                          <div className="text-sm">
                            <div>{shelter.contactPerson}</div>
                            <div className="text-muted-foreground">{shelter.contactPhone}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedShelter(shelter);
                              setIsDialogOpen(true);
                            }}
                          >
                            {t("COMMON.EDIT")}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(shelter._id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("COMMON.DELETE")
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t("COMMON.PAGINATION.PREVIOUS")}
              </Button>
              <span className="flex items-center px-4">
                {t("COMMON.PAGINATION.PAGE_OF", { page: page.toString(), total: totalPages })}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t("COMMON.PAGINATION.NEXT")}
              </Button>
            </div>
          )}
        </>
      )}

      <ShelterDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedShelter(null);
        }}
        shelter={selectedShelter}
      />
    </div>
  );
}
