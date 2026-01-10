"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Eye, CheckCircle, XCircle, Plus } from "lucide-react";
import { DateRange } from "react-day-picker";

import { useLanguage } from "@/contexts/LanguageContext";
import { useReports } from "@/hooks/useReports";
import { Report, ReportStatus, ReportType } from "@/types";
import { cn } from "@/lib/utils";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDialog } from "./report-dialog";

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ReportStatus | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  
  const { t } = useLanguage();
  const { reports, metadata, isLoading, updateStatus, isUpdating } = useReports({
    page,
    limit: 10,
    q,
    status: status === "ALL" ? undefined : status,
    fromDate: dateRange?.from?.toISOString(),
    toDate: dateRange?.to?.toISOString(),
  });

  const handleStatusChange = (newStatus: ReportStatus) => {
    if (selectedReport) {
      updateStatus(
        { id: selectedReport._id, status: newStatus },
        {
          onSuccess: () => {
            setDetailOpen(false);
            setSelectedReport(null);
          },
        }
      );
    }
  };

  const openDetail = (report: Report) => {
    setSelectedReport(report);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("REPORTS.TITLE")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("REPORTS.CREATE")}
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder={t("REPORTS.SEARCH_PLACEHOLDER")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[250px]"
          />
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as ReportStatus | "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("REPORTS.STATUS_PLACEHOLDER")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("REPORTS.ALL_STATUSES")}</SelectItem>
              <SelectItem value={ReportStatus.PENDING}>{t("REPORTS.STATUS.PENDING")}</SelectItem>
              <SelectItem value={ReportStatus.IN_PROGRESS}>{t("REPORTS.STATUS.IN_PROGRESS")}</SelectItem>
              <SelectItem value={ReportStatus.RESOLVED}>{t("REPORTS.STATUS.RESOLVED")}</SelectItem>
              <SelectItem value={ReportStatus.REJECTED}>{t("REPORTS.STATUS.REJECTED")}</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>{t("REPORTS.DATE_PICKER_PLACEHOLDER")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("REPORTS.COL_ID")}</TableHead>
              <TableHead>{t("REPORTS.COL_TITLE")}</TableHead>
              <TableHead>{t("REPORTS.COL_STATUS")}</TableHead>
              <TableHead>{t("REPORTS.COL_CREATED_AT")}</TableHead>
              <TableHead>{t("REPORTS.COL_ACTIONS")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("REPORTS.NO_RESULTS")}
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell className="font-medium truncate max-w-[100px]">{report._id}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        report.status === ReportStatus.PENDING && "bg-yellow-100 text-yellow-800",
                        report.status === ReportStatus.IN_PROGRESS && "bg-blue-100 text-blue-800",
                        report.status === ReportStatus.RESOLVED && "bg-green-100 text-green-800",
                        report.status === ReportStatus.REJECTED && "bg-red-100 text-red-800"
                      )}
                    >
                      {report.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {report.createdAt && !isNaN(new Date(report.createdAt).getTime()) 
                      ? format(new Date(report.createdAt), "PP p") 
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetail(report)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {report.status === ReportStatus.PENDING && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                              setSelectedReport(report);
                              handleStatusChange(ReportStatus.IN_PROGRESS);
                            }}
                            title="Approve"
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedReport(report);
                              handleStatusChange(ReportStatus.REJECTED);
                            }}
                            title="Reject"
                            disabled={isUpdating}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {report.status === ReportStatus.IN_PROGRESS && (
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                              setSelectedReport(report);
                              handleStatusChange(ReportStatus.RESOLVED);
                            }}
                            title="Resolve"
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1 || isLoading}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {metadata?.totalPage || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((old) => (metadata && page < metadata.totalPage ? old + 1 : old))}
          disabled={!metadata || page >= metadata.totalPage || isLoading}
        >
          Next
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("REPORTS.DETAILS")}</DialogTitle>
            <DialogDescription>ID: {selectedReport?._id}</DialogDescription>
          </DialogHeader>
          {selectedReport && (
             <div className="grid gap-6 py-4">
              {/* Status and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("REPORTS.TYPE")}</h4>
                  <p className="text-foreground font-medium">{selectedReport.type}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("REPORTS.COL_STATUS")}</h4>
                  <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1",
                        selectedReport.status === ReportStatus.PENDING && "bg-yellow-100 text-yellow-800",
                        selectedReport.status === ReportStatus.IN_PROGRESS && "bg-blue-100 text-blue-800",
                        selectedReport.status === ReportStatus.RESOLVED && "bg-green-100 text-green-800",
                        selectedReport.status === ReportStatus.REJECTED && "bg-red-100 text-red-800"
                      )}
                    >
                      {selectedReport.status}
                    </span>
                </div>
                 <div>
                   <h4 className="font-medium text-sm text-muted-foreground">Severity</h4>
                   <p className="text-foreground font-medium capitalize">{selectedReport.severity?.toLowerCase() || 'N/A'}</p>
                 </div>
                 <div>
                   <h4 className="font-medium text-sm text-muted-foreground">People Count</h4>
                   <p className="text-foreground font-medium">{selectedReport.peopleCount || 1}</p>
                 </div>
                 <div>
                   <h4 className="font-medium text-sm text-muted-foreground">Visibility</h4>
                   <p className="text-foreground font-medium">{selectedReport.isPublic ? 'Public' : 'Private'}</p>
                 </div>
                 <div>
                   <h4 className="font-medium text-sm text-muted-foreground">Rescuer</h4>
                   <p className="text-foreground font-medium">{(selectedReport as any).rescuer ? 'Assigned' : 'Unassigned'}</p> 
                 </div>
              </div>

               {/* People Involved */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                 <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Reporter (By)</h4>
                   {selectedReport.by ? (
                      <div className="text-sm">
                        <p className="font-medium">{selectedReport.by.firstName} {selectedReport.by.lastName}</p>
                        <p className="text-muted-foreground">{selectedReport.by.email}</p>
                      </div>
                   ) : (
                      <p className="text-sm text-muted-foreground">N/A</p>
                   )}
                </div>
                <div>
                   <h4 className="font-medium text-sm text-muted-foreground mb-1">Victim (User)</h4>
                   {selectedReport.user ? (
                      <div className="text-sm">
                        <p className="font-medium">{selectedReport.user.firstName} {selectedReport.user.lastName}</p>
                        <p className="text-muted-foreground">{selectedReport.user.email}</p>
                      </div>
                   ) : (
                      <p className="text-sm text-muted-foreground">N/A</p>
                   )}
                </div>
              </div>

              {/* Location & Notes */}
              <div className="grid gap-4 border-t pt-4">
                <div>
                   <h4 className="font-medium text-sm text-muted-foreground">{t("REPORTS.LOCATION")}</h4>
                   <p className="text-foreground text-sm mt-1">
                      {selectedReport.address ? selectedReport.address : (
                        <>
                           {selectedReport.location?.coordinates?.[1] ?? 'N/A'}, {selectedReport.location?.coordinates?.[0] ?? 'N/A'}
                        </>
                      )}
                   </p>
                </div>
                 <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("REPORTS.NOTES")}</h4>
                  <p className="text-foreground text-sm mt-1 whitespace-pre-wrap rounded-md bg-muted p-2">
                    {selectedReport.notes || t("REPORTS.NO_NOTES")}
                  </p>
                </div>
                 <div>
                  <h4 className="font-medium text-sm text-muted-foreground">{t("REPORTS.COL_CREATED_AT")}</h4>
                   <p className="text-foreground text-sm">
                    {selectedReport.createdAt && !isNaN(new Date(selectedReport.createdAt).getTime()) 
                      ? format(new Date(selectedReport.createdAt), "PPpp") 
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Close
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ReportDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
