const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

type Query = Record<string, string | number | boolean | undefined | null>;

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const buildQueryString = (params?: Query) => {
  if (!params) return "";
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
  return query ? `?${query}` : "";
};

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  const headers =
    options.body instanceof FormData
      ? {
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      : {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export type User = {
  id: string;
  email?: string;
  name?: string;
  umkm_id?: string;
  role?: string;
  umkm_name?: string;
};

export type LoginResponse = {
  access_token: string;
  token_type?: string;
  user: User;
};

export type Product = {
  id?: string | number;
  name: string;
  price?: number;
  category?: string;
  description?: string;
  is_active?: boolean;
  stock?: number;
  sku?: string;
  umkm_id?: string | number;
  created_at?: string;
};

export type Customer = {
  id?: string | number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  umkm_id?: string | number;
  created_at?: string;
};

export type Transaction = {
  id?: string | number;
  amount: number;
  transaction_type?: string;
  payment_status?: string;
  payment_method?: string;
  description?: string;
  customer_id?: string | number;
  product_id?: string | number;
  transaction_date?: string;
  items?: Array<{
    product_id?: string | number;
    quantity?: number;
    price?: number;
  }>;
  umkm_id?: string | number;
  user_id?: string | number;
  notes?: string;
};

export type Pagination<T> = {
  items: T[];
  total?: number;
  limit?: number;
  skip?: number;
};

export type DashboardData = {
  total_revenue?: number;
  total_transactions?: number;
  total_customers?: number;
  total_products?: number;
  revenue_growth?: number;
  revenue_growth_percentage?: number;
  pending_transactions?: number;
  top_products?: Array<{
    name?: string;
    revenue?: number;
    quantity_sold?: number;
  }>;
  payment_methods?: Array<{
    method?: string;
    count?: number;
    total_amount?: number;
    percentage?: number;
  }>;
  daily_sales?: Array<{
    date: string;
    revenue?: number;
    transactions?: number;
  }>;
};

export type TopProductResponse = {
  product_id?: number | string;
  product_name?: string;
  category?: string;
  total_sold?: number;
  total_revenue?: number;
  name?: string;
  quantity_sold?: number;
  revenue?: number;
};

export type AIInsightsResponse = {
  summary?: string;
  trends?: string[];
  recommendations?: string[];
  predictions?: {
    next_month_revenue_estimate?: number | null;
    next_month_transaction_estimate?: number | null;
    confidence?: string | number;
  };
};

export type BusinessHealthResponse = {
  total_score?: number;
  status?: string;
  message?: string;
  breakdown?: {
    revenue_growth?: number;
    consistency?: number;
    diversification?: number;
    customer_base?: number;
  };
  max_score?: number;
};

export type PaymentMethodStats = {
  payment_method?: string;
  method?: string;
  count?: number;
  total_amount?: number;
  percentage?: number;
};

export type MonthlyReportResponse = {
  month?: string;
  revenue?: number;
  transaction_count?: number;
  profit?: number;
  top_product?: string | null;
};

// Authentication
export const login = (email: string, password: string) =>
  request<LoginResponse>("/api/v1/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// Products
export const getProducts = (
  token: string,
  params?: {
    skip?: number;
    limit?: number;
    umkm_id?: string | number;
    category?: string;
    is_active?: boolean;
  },
) =>
  request<Product[]>(
    `/api/v1/products${buildQueryString(params as Query)}`,
    { method: "GET" },
    token,
  );

export const createProduct = (token: string, payload: Product) =>
  request<Product>(
    "/api/v1/products/",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );

export const updateProduct = (
  token: string,
  productId: string | number,
  payload: Partial<Product>,
) =>
  request<Product>(
    `/api/v1/products/${productId}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token,
  );

export const deleteProduct = (token: string, productId: string | number) =>
  request<{ message?: string }>(
    `/api/v1/products/${productId}`,
    { method: "DELETE" },
    token,
  );

// Customers
export const getCustomers = (
  token: string,
  params?: {
    skip?: number;
    limit?: number;
    umkm_id?: string | number;
    search?: string;
  },
) =>
  request<Customer[]>(
    `/api/v1/customers${buildQueryString(params as Query)}`,
    { method: "GET" },
    token,
  );

export const createCustomer = (token: string, payload: Customer) =>
  request<Customer>(
    "/api/v1/customers/",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );

export const updateCustomer = (
  token: string,
  customerId: string | number,
  payload: Partial<Customer>,
) =>
  request<Customer>(
    `/api/v1/customers/${customerId}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token,
  );

export const deleteCustomer = (token: string, customerId: string | number) =>
  request<{ message?: string }>(
    `/api/v1/customers/${customerId}`,
    { method: "DELETE" },
    token,
  );

// Transactions
export const getTransactions = (
  token: string,
  params?: {
    skip?: number;
    limit?: number;
    umkm_id?: string | number;
    payment_status?: string;
    start_date?: string;
    end_date?: string;
  },
) =>
  request<Transaction[]>(
    `/api/v1/transactions${buildQueryString(params as Query)}`,
    { method: "GET" },
    token,
  );

export const createTransaction = (
  token: string,
  payload: Transaction,
  userId?: string | number,
) => {
  const query = buildQueryString(userId ? { user_id: userId } : undefined);
  return request<Transaction>(
    `/api/v1/transactions${query}`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
};

export const updateTransaction = (
  token: string,
  transactionId: string | number,
  payload: Partial<Transaction>,
) =>
  request<Transaction>(
    `/api/v1/transactions/${transactionId}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token,
  );

export const deleteTransaction = (
  token: string,
  transactionId: string | number,
) =>
  request<{ message?: string }>(
    `/api/v1/transactions/${transactionId}`,
    { method: "DELETE" },
    token,
  );

// Analytics
export const getDashboard = (
  token: string,
  umkmId: string | number,
  options?: { days?: number },
) =>
  request<DashboardData>(
    `/api/v1/analytics/dashboard${buildQueryString({
      umkm_id: umkmId,
      days: options?.days,
    })}`,
    { method: "GET" },
    token,
  );

export const getSalesReport = (
  token: string,
  umkmId: string | number,
  params?: { start_date?: string; end_date?: string },
) =>
  request<Record<string, unknown>>(
    `/api/v1/analytics/sales-report${buildQueryString({
      umkm_id: umkmId,
      ...params,
    })}`,
    { method: "GET" },
    token,
  );

export const getTopProducts = (
  token: string,
  umkmId: string | number,
  params?: { limit?: number; days?: number },
) =>
  request<Array<TopProductResponse>>(
    `/api/v1/analytics/top-products${buildQueryString({
      umkm_id: umkmId,
      ...params,
    })}`,
    { method: "GET" },
    token,
  );

export const getMonthlyReport = (
  token: string,
  umkmId: string | number,
  params?: { months?: number },
) =>
  request<Array<MonthlyReportResponse>>(
    `/api/v1/analytics/monthly-report${buildQueryString({
      umkm_id: umkmId,
      ...params,
    })}`,
    { method: "GET" },
    token,
  );

export const getPaymentMethods = (
  token: string,
  umkmId: string | number,
  params?: { days?: number },
) =>
  request<Array<PaymentMethodStats>>(
    `/api/v1/analytics/payment-methods${buildQueryString({
      umkm_id: umkmId,
      ...params,
    })}`,
    { method: "GET" },
    token,
  );

export const getAIInsights = (
  token: string,
  umkmId: string | number,
  params?: { days?: number },
) =>
  request<AIInsightsResponse>(
    `/api/v1/analytics/ai-insights${buildQueryString({
      umkm_id: umkmId,
      ...params,
    })}`,
    { method: "GET" },
    token,
  );

export const getBusinessHealth = (token: string, umkmId: string | number) =>
  request<BusinessHealthResponse>(
    `/api/v1/analytics/business-health${buildQueryString({
      umkm_id: umkmId,
    })}`,
    { method: "GET" },
    token,
  );

// OCR Upload (assumed endpoint)
export const uploadReceipt = (
  token: string,
  file: File | Blob,
  extra?: Query,
) => {
  const formData = new FormData();
  formData.append("file", file);
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
  }
  return request<{ text: string; metadata?: Record<string, unknown> }>(
    "/api/v1/ocr/upload",
    { method: "POST", body: formData },
    token,
  );
};

// Content Agent
export const sendContentMessage = async (
  token: string,
  payload: { message: string; image?: File | Blob },
) => {
  type ContentMessageResponse = { reply?: string; response?: string; thread_id?: string };

  if (payload.image) {
    const formData = new FormData();
    formData.append("message", payload.message);
    formData.append("image", payload.image);
    return request<ContentMessageResponse>(
      "/api/v1/content-agent/chat",
      { method: "POST", body: formData },
      token,
    ).then((res) => ({
      reply: res.reply ?? res.response ?? "",
      thread_id: res.thread_id,
    }));
  }

  return request<ContentMessageResponse>(
    "/api/v1/content-agent/chat",
    { method: "POST", body: JSON.stringify({ message: payload.message }) },
    token,
  ).then((res) => ({
    reply: res.reply ?? res.response ?? "",
    thread_id: res.thread_id,
  }));
};

export const getContentHistory = (token: string, limit = 20) =>
  request<
    Array<{
      role?: string;
      message?: string;
      user_input?: string;
      assistant_output?: string;
      created_at?: string;
    }>
  >(
    `/api/v1/content-agent/history${buildQueryString({ limit })}`,
    { method: "GET" },
    token,
  );

export const clearContentHistory = (token: string) =>
  request<{ message?: string }>(
    "/api/v1/content-agent/history",
    { method: "DELETE" },
    token,
  );

export const deleteContentThread = (token: string) =>
  request<{ message?: string }>(
    "/api/v1/content-agent/thread",
    { method: "DELETE" },
    token,
  );

export const healthCheck = () =>
  request<{ status?: string }>("/", { method: "GET" });
