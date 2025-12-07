"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getMonthlyReport,
  getSalesReport,
  getTopProducts,
  type MonthlyReportResponse,
  type TopProductResponse,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CalendarRange, RefreshCw } from "lucide-react";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function ReportsPage() {
  const { token, user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [salesReport, setSalesReport] = useState<Record<string, any> | null>(
    null,
  );
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportResponse[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductResponse[]>([]);

  const umkmId = useMemo(
    () => (user?.umkm_id as string) || "",
    [user?.umkm_id],
  );

  const fetchReports = async () => {
    if (!token || !umkmId) return;
    setLoading(true);
    const monthsParam =
      Number.isFinite(months) && months > 0 ? Math.min(months, 12) : 6;
    try {
      const [sales, monthly, top] = await Promise.all([
        getSalesReport(token, umkmId, {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        getMonthlyReport(token, umkmId, { months: monthsParam }),
        getTopProducts(token, umkmId, { limit: 5 }),
      ]);
      setSalesReport(sales);
      setMonthlyReport(monthly || []);
      setTopProducts(
        (top || []).map((item) => ({
          ...item,
          quantity_sold: item.quantity_sold ?? item.total_sold,
          revenue: item.revenue ?? item.total_revenue,
          name: item.name || item.product_name,
        })),
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to load reports right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="space-y-6">
      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Reports
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Sales and monthly summaries
            </h1>
            <p className="text-sm text-muted-foreground">
              Pull structured reports from FastAPI analytics endpoints for
              lender-ready PDFs or investor updates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <Label>Start date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>End date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Months (for monthly)</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-28"
              />
            </div>
            <Button onClick={fetchReports} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Sales report
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Period performance
              </h3>
            </div>
            <CalendarRange className="h-4 w-4 text-emerald-600" />
          </div>
          {salesReport ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/60 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Revenue
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {currency.format(salesReport.total_revenue || 0)}
                </p>
              </div>
              <div className="rounded-xl border border-white/60 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Profit
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {currency.format(salesReport.total_profit || 0)}
                </p>
              </div>
              <div className="rounded-xl border border-white/60 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Transactions
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {(salesReport.transaction_count || 0).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-xl border border-white/60 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Avg ticket
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {currency.format(salesReport.average_order_value || 0)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No report yet. Choose a date range and refresh.
            </p>
          )}
        </Card>

        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Top products
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Best performers
              </h3>
            </div>
            <BarChart3 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {topProducts.length ? (
              topProducts.map((item, idx) => (
                <div
                  key={`${item.name || item.product_name || "item"}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">#{idx + 1}</Badge>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {String(item.name || item.product_name || "Unnamed")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity_sold || item.total_sold || item.count || 0} units
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-mono text-slate-900 dark:text-white">
                    {currency.format(Number(item.revenue || item.total_revenue || 0))}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No top products data yet.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Monthly report (last {months} months)
          </h2>
        </div>
        <Table>
          <TableCaption>
            {loading ? "Loading monthly report..." : "Monthly performance"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Transactions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyReport.map((month) => (
              <TableRow key={month.month}>
                <TableCell>{month.month || "—"}</TableCell>
                <TableCell>
                  {currency.format(Number(month.revenue || 0))}
                </TableCell>
                <TableCell>
                  {currency.format(Number(month.profit || 0))}
                </TableCell>
                <TableCell>
                  {(Number(month.transaction_count || 0)).toLocaleString(
                    "id-ID",
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!monthlyReport.length && !loading && (
          <p className="text-sm text-muted-foreground mt-3">
            No monthly data yet. Refresh once transactions exist.
          </p>
        )}
      </Card>
    </div>
  );
}
