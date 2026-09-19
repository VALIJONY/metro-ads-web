import { tokenStore } from "./tokens";
import type {
  AdType,
  Booking,
  Car,
  Client,
  ClientStats,
  ClientsReportRow,
  Contract,
  DashboardStats,
  DebtRow,
  Depot,
  DepotStats,
  FreeSpacesResult,
  HistoryRow,
  LoginResponse,
  OccupancyTrendRow,
  Paginated,
  Payment,
  RevenueRow,
  SpaceHistoryRow,
  Train,
  TrainLayout,
  User,
  EndingSoonContract,
  OccupancyRow,
} from "./types";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;

  constructor(status: number, message: string, code = "error", details: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/api/v1/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (data.refresh) tokenStore.set(data.access, data.refresh);
        else tokenStore.setAccess(data.access);
        return data.access as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  isForm?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, isForm = false, headers, ...rest } = options;

  const doFetch = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };
    if (!isForm && body !== undefined) finalHeaders["Content-Type"] = "application/json";
    if (auth) {
      const access = tokenStore.getAccess();
      if (access) finalHeaders["Authorization"] = `Bearer ${access}`;
    }
    return fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  };

  let res = await doFetch();

  if (res.status === 401 && auth && tokenStore.getRefresh()) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await doFetch();
    } else {
      tokenStore.clear();
      // Bu plain module (React komponenti emas) — useRouter ishlatib bo'lmaydi, shuning uchun to'liq reload.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new ApiRequestError(401, "Sessiya tugadi, qayta kiring", "not_authenticated");
    }
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    if (typeof data === "object" && data && "error" in data) {
      throw new ApiRequestError(res.status, data.message ?? "Xatolik", data.error, data.details ?? {});
    }
    throw new ApiRequestError(res.status, typeof data === "string" ? data : "Xatolik yuz berdi");
  }

  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/api/v1/auth/login/", { method: "POST", body: { username, password }, auth: false }),

  logout: () => {
    const refresh = tokenStore.getRefresh();
    return request<void>("/api/v1/auth/logout/", { method: "POST", body: { refresh } });
  },

  me: () => request<User>("/api/v1/auth/me/"),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<void>("/api/v1/auth/change-password/", {
      method: "POST",
      body: { old_password: oldPassword, new_password: newPassword },
    }),

  users: {
    list: (params?: { role?: string; is_active?: boolean; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.role) qs.set("role", params.role);
      if (params?.is_active !== undefined) qs.set("is_active", String(params.is_active));
      if (params?.search) qs.set("search", params.search);
      qs.set("page_size", "100");
      return request<Paginated<User>>(`/api/v1/users/?${qs}`);
    },
    create: (body: {
      username: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      role: string;
      password?: string;
    }) => request<User>("/api/v1/users/", { method: "POST", body }),
    update: (
      id: number,
      body: Partial<{
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        role: string;
        is_active: boolean;
      }>
    ) => request<User>(`/api/v1/users/${id}/`, { method: "PATCH", body }),
    deactivate: (id: number) => request<User>(`/api/v1/users/${id}/deactivate/`, { method: "POST" }),
    resetPassword: (id: number, newPassword?: string) =>
      request<{ new_password: string }>(`/api/v1/users/${id}/reset-password/`, {
        method: "POST",
        body: newPassword ? { new_password: newPassword } : {},
      }),
  },

  depots: {
    list: () => request<Paginated<Depot>>("/api/v1/depots/?page_size=100"),
    stats: (id: number) => request<DepotStats>(`/api/v1/depots/${id}/stats/`),
    create: (body: { code: string; name: string; address?: string; note?: string }) =>
      request<Depot>("/api/v1/depots/", { method: "POST", body }),
    update: (id: number, body: Partial<{ code: string; name: string; address: string; note: string }>) =>
      request<Depot>(`/api/v1/depots/${id}/`, { method: "PATCH", body }),
    remove: (id: number) => request<void>(`/api/v1/depots/${id}/`, { method: "DELETE" }),
  },

  trains: {
    list: (params?: { depot?: number; status?: string; is_active?: boolean; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.depot) qs.set("depot", String(params.depot));
      if (params?.status) qs.set("status", params.status);
      if (params?.is_active !== undefined) qs.set("is_active", String(params.is_active));
      if (params?.search) qs.set("search", params.search);
      qs.set("page_size", "100");
      const suffix = qs.toString() ? `?${qs}` : "";
      return request<Paginated<Train>>(`/api/v1/trains/${suffix}`);
    },
    layout: (id: number, date?: string) =>
      request<TrainLayout>(`/api/v1/trains/${id}/layout/${date ? `?date=${date}` : ""}`),
    get: (id: number) => request<Train>(`/api/v1/trains/${id}/`),
    create: (body: {
      depot: number;
      number: string;
      status: "new" | "old";
      line?: string;
      default_ad_type: number;
      car_count?: number;
    }) => request<Train>("/api/v1/trains/", { method: "POST", body }),
    update: (id: number, body: Partial<{ depot: number; number: string; status: "new" | "old"; line: string; is_active: boolean }>) =>
      request<Train>(`/api/v1/trains/${id}/`, { method: "PATCH", body }),
    remove: (id: number) => request<void>(`/api/v1/trains/${id}/`, { method: "DELETE" }),
    addCar: (id: number, body: { position: number; serial_number?: string; type?: string }) =>
      request<Car>(`/api/v1/trains/${id}/add-car/`, { method: "POST", body }),
  },

  adTypes: {
    list: () => request<Paginated<AdType>>("/api/v1/ad-types/?page_size=100"),
    create: (body: { name: string; unit?: string; size_type: "area" | "complex"; default_base_price?: string; note?: string }) =>
      request<AdType>("/api/v1/ad-types/", { method: "POST", body }),
    update: (
      id: number,
      body: Partial<{ name: string; unit: string; size_type: "area" | "complex"; default_base_price: string; note: string }>
    ) => request<AdType>(`/api/v1/ad-types/${id}/`, { method: "PATCH", body }),
    remove: (id: number) => request<void>(`/api/v1/ad-types/${id}/`, { method: "DELETE" }),
  },

  spaces: {
    create: (body: {
      car: number;
      ad_type: number;
      side: string;
      position: number;
      area_m2: string;
      base_price: string;
    }) => request(`/api/v1/spaces/`, { method: "POST", body }),
    update: (id: number, body: Partial<{ ad_type: number; area_m2: string; base_price: string; note: string }>) =>
      request(`/api/v1/spaces/${id}/`, { method: "PATCH", body }),
    setStatus: (id: number, status: string, reason = "") =>
      request(`/api/v1/spaces/${id}/set-status/`, { method: "POST", body: { status, reason } }),
    remove: (id: number) => request<void>(`/api/v1/spaces/${id}/`, { method: "DELETE" }),
    history: (id: number) => request<SpaceHistoryRow[]>(`/api/v1/spaces/${id}/history/`),
    free: (params: {
      start_date: string;
      end_date: string;
      depot?: number;
      train?: number;
      ad_type?: number;
      min_area?: string;
    }) => {
      const qs = new URLSearchParams({ start_date: params.start_date, end_date: params.end_date });
      if (params.depot) qs.set("depot", String(params.depot));
      if (params.train) qs.set("train", String(params.train));
      if (params.ad_type) qs.set("ad_type", String(params.ad_type));
      if (params.min_area) qs.set("min_area", params.min_area);
      return request<FreeSpacesResult>(`/api/v1/spaces/free/?${qs}`);
    },
  },

  bookings: {
    create: (body: {
      contract: number;
      ad_space: number;
      ad_name: string;
      start_date?: string;
      end_date?: string;
      price?: string;
      used_area?: string;
      quantity?: number;
      note?: string;
    }) => request<Booking>("/api/v1/bookings/", { method: "POST", body }),
    cancel: (id: number, reason = "") =>
      request(`/api/v1/bookings/${id}/cancel/`, { method: "POST", body: { reason } }),
    markInstalled: (id: number, date?: string) =>
      request<Booking>(`/api/v1/bookings/${id}/mark-installed/`, { method: "POST", body: date ? { date } : {} }),
    markRemoved: (id: number, date?: string) =>
      request<Booking>(`/api/v1/bookings/${id}/mark-removed/`, { method: "POST", body: date ? { date } : {} }),
    bulk: (body: {
      contract: number;
      items: {
        ad_space: number;
        ad_name: string;
        price?: string;
        used_area?: string;
        start_date?: string;
        end_date?: string;
        quantity?: number;
      }[];
    }) =>
      request<{ created: number; total: string; results: { id: number; space_code: string; price: string }[] }>(
        "/api/v1/bookings/bulk/",
        { method: "POST", body }
      ),
  },

  clients: {
    list: (search?: string) =>
      request<Paginated<Client>>(
        `/api/v1/clients/?page_size=100${search ? `&search=${encodeURIComponent(search)}` : ""}`
      ),
    get: (id: number) => request<Client>(`/api/v1/clients/${id}/`),
    contracts: (id: number) => request<Contract[]>(`/api/v1/clients/${id}/contracts/`),
    stats: (id: number) => request<ClientStats>(`/api/v1/clients/${id}/stats/`),
    create: (body: {
      name: string;
      tin?: string;
      phone?: string;
      email?: string;
      address?: string;
      contact_person?: string;
    }) => request<Client>("/api/v1/clients/", { method: "POST", body }),
    update: (id: number, body: Partial<Client>) =>
      request<Client>(`/api/v1/clients/${id}/`, { method: "PATCH", body }),
    remove: (id: number) => request<void>(`/api/v1/clients/${id}/`, { method: "DELETE" }),
  },

  contracts: {
    list: (search?: string) =>
      request<Paginated<Contract>>(
        `/api/v1/contracts/?page_size=100${search ? `&search=${encodeURIComponent(search)}` : ""}`
      ),
    get: (id: number) => request<Contract>(`/api/v1/contracts/${id}/`),
    create: (body: {
      client: number;
      number: string;
      date: string;
      start_date: string;
      end_date: string;
      amount: string;
      currency?: string;
    }) => request<Contract>("/api/v1/contracts/", { method: "POST", body }),
    update: (
      id: number,
      body: Partial<{ number: string; date: string; start_date: string; end_date: string; amount: string; note: string }>
    ) => request<Contract>(`/api/v1/contracts/${id}/`, { method: "PATCH", body }),
    remove: (id: number) => request<void>(`/api/v1/contracts/${id}/`, { method: "DELETE" }),
    activate: (id: number) => request<Contract>(`/api/v1/contracts/${id}/activate/`, { method: "POST" }),
    cancel: (id: number, reason = "") =>
      request<Contract>(`/api/v1/contracts/${id}/cancel/`, { method: "POST", body: { reason } }),
    bookings: (id: number) => request<Booking[]>(`/api/v1/contracts/${id}/bookings/`),
    history: (id: number) => request<HistoryRow[]>(`/api/v1/contracts/${id}/history/`),
    uploadFile: (id: number, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request<Contract>(`/api/v1/contracts/${id}/file/`, { method: "POST", body: form, isForm: true });
    },
  },

  payments: {
    list: (contractId: number) =>
      request<Paginated<Payment>>(`/api/v1/payments/?contract=${contractId}&page_size=100`),
    create: (body: { contract: number; amount: string; payment_date: string; payment_type?: string; document_number?: string; note?: string }) =>
      request<Payment>("/api/v1/payments/", { method: "POST", body }),
    remove: (id: number) => request<void>(`/api/v1/payments/${id}/`, { method: "DELETE" }),
  },

  reports: {
    dashboard: (date?: string) =>
      request<DashboardStats>(`/api/v1/reports/dashboard/${date ? `?date=${date}` : ""}`),
    endingSoon: (days = 30) =>
      request<EndingSoonContract[]>(`/api/v1/reports/ending-soon/?days=${days}`),
    occupancy: (groupBy: "depot" | "train" | "ad_type") =>
      request<OccupancyRow[]>(`/api/v1/reports/occupancy/?group_by=${groupBy}`),
    occupancyTrend: (startDate: string, endDate: string, depotId?: number) =>
      request<OccupancyTrendRow[]>(
        `/api/v1/reports/occupancy-trend/?start_date=${startDate}&end_date=${endDate}${depotId ? `&depot=${depotId}` : ""}`
      ),
    revenue: (startDate: string, endDate: string, groupBy: "month" | "client" | "depot" = "month") =>
      request<RevenueRow[]>(
        `/api/v1/reports/revenue/?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`
      ),
    clientsReport: (startDate: string, endDate: string) =>
      request<ClientsReportRow[]>(`/api/v1/reports/clients/?start_date=${startDate}&end_date=${endDate}`),
    debt: () => request<DebtRow[]>("/api/v1/reports/debt/"),
  },
};

export async function downloadReportExcel(reportType: string, params?: Record<string, string>) {
  const access = tokenStore.getAccess();
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const res = await fetch(`${BASE_URL}/api/v1/reports/${reportType}/excel/${qs}`, {
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  });
  if (!res.ok) throw new ApiRequestError(res.status, "Excel faylni yuklab bo'lmadi");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadContractFile(contractId: number, fileName: string) {
  const access = tokenStore.getAccess();
  const res = await fetch(`${BASE_URL}/api/v1/contracts/${contractId}/file/`, {
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  });
  if (!res.ok) throw new ApiRequestError(res.status, "Faylni yuklab bo'lmadi");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "contract";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
