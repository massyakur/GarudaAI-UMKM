"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CreditCard,
  Gauge,
  LineChart as LineChartIcon,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getAIInsights,
  getBusinessHealth,
  getDashboard,
  getTopProducts,
  getPaymentMethods,
  type AIInsightsResponse,
  type BusinessHealthResponse,
  type DashboardData,
  type TopProductResponse,
  type PaymentMethodStats,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const percent = (value?: number) =>
  typeof value === "number" && !Number.isNaN(value)
    ? `${value.toFixed(1)}%`
    : "N/A";

const formatCurrencyOrNA = (value?: number | null) =>
  value === null || value === undefined ? "N/A" : currency.format(value);

const confidence = (value?: number | string) => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    const normalized = value <= 1 ? value * 100 : value;
    return `${normalized.toFixed(0)}%`;
  }
  if (typeof value === "string") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return "N/A";
};

type MetricCardProps = {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
};

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            {title}
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p className="text-xs text-emerald-600 dark:text-emerald-300">
              {change}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 text-white grid place-items-center">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null);
  const [businessHealth, setBusinessHealth] =
    useState<BusinessHealthResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductResponse[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [umkmId, setUmkmId] = useState<string>(
    (user?.umkm_id as string) || "",
  );
  const isAdmin = user?.role?.toLowerCase?.() === "admin";

  useEffect(() => {
    if (!isAdmin && user?.umkm_id) {
      setUmkmId(String(user.umkm_id));
    }
  }, [isAdmin, user?.umkm_id]);

  const fetchAnalytics = async () => {
    if (!token || !umkmId) {
      return;
    }
    setLoading(true);
    setError(null);
    const daysParam =
      Number.isFinite(days) && days > 0 ? Math.min(days, 365) : undefined;
    try {
      const [
        dashboardData,
        insightsData,
        healthData,
        topProductsData,
        paymentMethodsData,
      ] = await Promise.all([
        getDashboard(token, umkmId, { days: daysParam }),
        getAIInsights(token, umkmId, { days: daysParam }),
        getBusinessHealth(token, umkmId),
        getTopProducts(token, umkmId, { limit: 10, days: daysParam }),
        getPaymentMethods(token, umkmId, { days: daysParam }),
      ]);
      setDashboard(dashboardData);
      setAiInsights(insightsData);
      setBusinessHealth(healthData);
      setTopProducts(
        (topProductsData || []).map((item, idx) => ({
          ...item,
          total_sold: item.total_sold ?? item.quantity_sold,
          total_revenue: item.total_revenue ?? item.revenue,
          product_name: item.product_name || item.name,
          product_id: item.product_id ?? item.product_name ?? idx,
        })),
      );
      setPaymentMethods(
        (paymentMethodsData || []).map((item, idx) => ({
          ...item,
          method: item.payment_method || item.method,
          payment_method: item.payment_method || item.method,
          total_amount: item.total_amount ?? 0,
          count: item.count ?? 0,
          percentage: item.percentage,
          key: item.payment_method || item.method || idx,
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data right now.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && umkmId) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, umkmId]);

  const salesData = useMemo(
    () =>
      dashboard?.daily_sales?.map((item) => ({
        date: item.date,
        revenue: item.revenue || 0,
        transactions: item.transactions || 0,
      })) || [],
    [dashboard],
  );

  const growthPercent =
    dashboard?.revenue_growth ?? dashboard?.revenue_growth_percentage ?? 0;

  const healthScore = Math.max(businessHealth?.total_score ?? 0, 0);
  const maxHealthScore = businessHealth?.max_score || 100;
  const healthScorePercent =
    maxHealthScore > 0 ? Math.min((healthScore / maxHealthScore) * 100, 100) : 0;

  const paymentMethodsToShow =
    paymentMethods.length > 0
      ? paymentMethods
      : (dashboard?.payment_methods || []).map((pm, idx) => ({
          method: pm.method,
          payment_method: pm.method,
          total_amount: pm.total_amount,
          count: pm.count,
          percentage: pm.percentage,
          key: pm.method || idx,
        }));

  const healthBreakdown = [
    { label: "Revenue growth", value: businessHealth?.breakdown?.revenue_growth },
    { label: "Consistency", value: businessHealth?.breakdown?.consistency },
    { label: "Diversification", value: businessHealth?.breakdown?.diversification },
    { label: "Customer base", value: businessHealth?.breakdown?.customer_base },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_0.6fr]">
        <Card className="p-4 md:p-6 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Overview
              </p>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Financial pulse and product velocity
              </h1>
              <p className="text-sm text-muted-foreground">
                Connected to FastAPI analytics. Adjust UMKM ID or timeframe and
                refresh.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  UMKM ID
                </Label>
                <Input
                  value={umkmId}
                  placeholder="Enter UMKM ID"
                  onChange={(e) => setUmkmId(e.target.value)}
                  className="w-40"
                  disabled={!isAdmin}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Days
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <Button onClick={fetchAnalytics} disabled={!umkmId || loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
        </Card>
        <Card className="p-4 border-white/70 dark:border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-800 text-white shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                Credit eligibility
              </p>
              <h3 className="text-xl font-semibold">KUR readiness snapshot</h3>
              <p className="text-sm text-slate-200/80">
                Use the Transactions and Reports pages to keep data fresh before
                checking your latest score.
              </p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Beta
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/20 p-3 bg-white/5">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                Pending Tx
              </p>
              <p className="text-2xl font-semibold">
                {dashboard?.pending_transactions ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-white/20 p-3 bg-white/5">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                Growth
              </p>
              <p className="text-2xl font-semibold">
                {percent(dashboard?.revenue_growth_percentage || 0)}
              </p>
            </div>
          </div>
          <Button variant="secondary" className="mt-4 w-full">
            Run quick credit check
          </Button>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total revenue"
          value={currency.format(dashboard?.total_revenue || 0)}
          change={percent(growthPercent)}
          icon={<LineChartIcon className="h-4 w-4" />}
        />
        <MetricCard
          title="Transactions"
          value={(dashboard?.total_transactions || 0).toLocaleString("id-ID")}
          icon={<Gauge className="h-4 w-4" />}
        />
        <MetricCard
          title="Customers"
          value={(dashboard?.total_customers || 0).toLocaleString("id-ID")}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Products"
          value={(dashboard?.total_products || 0).toLocaleString("id-ID")}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Daily sales
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Revenue trend (last {days} days)
              </h3>
            </div>
            <LineChartIcon className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="h-64">
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "var(--primary)" },
                transactions: {
                  label: "Transactions",
                  color: "var(--chart-2)",
                },
              }}
            >
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Payment mix
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Method breakdown
              </h3>
            </div>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {paymentMethodsToShow.length ? (
              paymentMethodsToShow.map((method, idx) => (
                <div
                  key={`${method.payment_method || method.method || idx}`}
                  className="flex items-center justify-between rounded-lg border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {method.payment_method || method.method || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(method.count || 0).toLocaleString("id-ID")} payments
                    </p>
                    {method.percentage !== undefined && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        {percent(method.percentage)} of mix
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-mono text-slate-900 dark:text-white">
                    {currency.format(method.total_amount || 0)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment method data yet.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Top products
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Leaders by revenue
              </h3>
            </div>
            <BarChart3 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {topProducts.length ? (
              topProducts.map((product, idx) => (
                <div
                  key={product.product_id ?? product.product_name ?? idx}
                  className="flex items-center justify-between rounded-lg border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                      #{idx + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {product.product_name || "Unnamed product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.category || "Uncategorized"} · {product.total_sold || 0} units
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-mono text-slate-900 dark:text-white">
                    {currency.format(product.total_revenue || 0)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No product leaderboard yet.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                AI insights
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Signals & actions
              </h3>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100">
              AI
            </Badge>
          </div>
          {aiInsights ? (
            <div className="space-y-3">
              {aiInsights.summary && (
                <p className="text-sm text-muted-foreground">
                  {aiInsights.summary}
                </p>
              )}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Trends
                </p>
                {aiInsights.trends?.length ? (
                  <ul className="space-y-2">
                    {aiInsights.trends.slice(0, 3).map((trend, idx) => (
                      <li
                        key={`trend-${idx}`}
                        className="rounded-lg border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-2 text-sm text-slate-900 dark:text-white"
                      >
                        {trend}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No trend signals yet.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Recommendations
                </p>
                {aiInsights.recommendations?.length ? (
                  <ul className="space-y-2">
                    {aiInsights.recommendations.slice(0, 3).map((rec, idx) => (
                      <li
                        key={`rec-${idx}`}
                        className="rounded-lg border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-2 text-sm text-slate-900 dark:text-white"
                      >
                        {rec}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No AI recommendations yet.
                  </p>
                )}
              </div>
              {aiInsights.predictions && (
                <div className="rounded-lg border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                    Prediction
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrencyOrNA(
                          aiInsights.predictions.next_month_revenue_estimate,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Projected revenue next month
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        Transactions
                      </p>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {aiInsights.predictions
                          .next_month_transaction_estimate !== undefined &&
                        aiInsights.predictions
                          .next_month_transaction_estimate !== null
                          ? Number(
                              aiInsights.predictions
                                .next_month_transaction_estimate,
                            ).toLocaleString("id-ID")
                          : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Confidence {confidence(aiInsights.predictions.confidence)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Refresh to fetch AI insights for this UMKM.
            </p>
          )}
        </Card>

        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Business health
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Credit readiness
              </h3>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100">
              {businessHealth?.status || `${Math.round(healthScore)} / ${maxHealthScore}`}
            </Badge>
          </div>
          {businessHealth ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Health score
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                    {Math.round(healthScore)}
                  </p>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                        style={{ width: `${healthScorePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {businessHealth.status || "Calculating..."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {healthBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      {item.label}
                    </p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {item.value ?? "N/A"}
                    </p>
                  </div>
                ))}
              </div>
              {businessHealth.message && (
                <p className="text-xs text-muted-foreground">
                  {businessHealth.message}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Refresh to calculate business health score.
            </p>
          )}
        </Card>
      </div>

      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Notes
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Operating checklist
            </h3>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
          <li>
            Keep UMKM ID consistent across product, customer, and transaction
            creation.
          </li>
          <li>
            Sync receipts through the OCR modal on Transactions to reduce
            manual entry.
          </li>
          <li>
            Use Reports for monthly summaries before sharing updates to lenders.
          </li>
          <li>
            Try the Content Agent to draft promos or customer updates from live
            numbers.
          </li>
        </ul>
      </Card>
    </div>
  );
}
