// Lightweight API client for the AgriSmart backend.
const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api/v1";
const TOKEN_KEY = "agrismart_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message); this.status = status; this.data = data;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
  const isJSON = res.headers.get("content-type")?.includes("application/json");
  const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    if (res.status === 401) tokenStore.clear();
    const msg = (body && typeof body === "object" && (body as any).error) || res.statusText || "Request failed";
    throw new ApiError(res.status, typeof msg === "string" ? msg : "Request failed", body);
  }
  return body as T;
}

// ---------- Types ----------
export interface User {
  id: string; name: string; email: string;
  role: "farmer" | "buyer" | "admin";
  phone?: string; language?: string; avatar_url?: string;
  state?: string; district?: string; village?: string;
  email_verified?: boolean;
}
interface AuthResponse { ok: true; token: string; user: User }

export interface Farm {
  id: string; name: string; area_acres: number;
  soil_type?: string; irrigation_type?: string;
  lat?: number; lng?: number; address?: string;
  created_at: string;
}
export interface Crop {
  id: string; farm_id: string; name: string; variety?: string;
  sown_at?: string; expected_harvest_at?: string;
  health_status: "good" | "moderate" | "poor"; notes?: string;
  created_at: string;
}
export interface Listing {
  id: string; seller_id: string; seller_name?: string;
  title: string; category: string; description?: string;
  price_per_unit: number; unit: string; quantity_available: number;
  images: string[]; location?: string; is_active: boolean;
  created_at: string;
}
export interface Order {
  id: string; buyer_id: string; seller_id: string; listing_id: string;
  listing_title?: string; unit?: string;
  quantity: number; total_amount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shipping_address?: string; created_at: string;
}
export interface Notification {
  id: string; user_id: string; type: string;
  title: string; body: string; read_at: string | null; created_at: string;
}
export interface DashboardSummary {
  farms: number; crops: number; activeListings: number;
  unreadNotifications: number;
  recentOrders: { id: string; status: string; total_amount: number; created_at: string; listing_title: string }[];
}
export interface MarketPrice {
  id: string; cropName: string; city: string; market: string;
  minPrice: number | null; maxPrice: number | null; avgPrice: number;
  previousAvgPrice: number | null; changePercent: number | null;
  unit: string; date: string; source: string;
}

// ---------- API ----------
export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; role?: "farmer" | "buyer" }) =>
      request<{ ok: true; user: User; otpSent: boolean; ttlMinutes: number }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    requestOtp: (email: string) =>
      request<{ ok: true; ttlMinutes: number }>("/auth/otp/request", { method: "POST", body: JSON.stringify({ email }) }),
    verifyOtp: (email: string, code: string) =>
      request<AuthResponse>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ email, code }) }),
    forgotPassword: (email: string) =>
      request<{ ok: true; message: string }>("/auth/password/forgot", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (data: { email: string; code: string; password: string }) =>
      request<{ ok: true; message: string }>("/auth/password/reset", { method: "POST", body: JSON.stringify(data) }),
    logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
    me: () => request<{ ok: true; user: User }>("/auth/me"),
  },
  users: {
    updateMe: (data: Partial<User>) =>
      request<{ ok: true; user: User }>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  },
  dashboard: {
    summary: () => request<{ ok: true; data: DashboardSummary }>("/dashboard"),
  },
  farms: {
    list: () => request<{ ok: true; data: Farm[]; total: number }>("/farms"),
    get: (id: string) => request<{ ok: true; data: Farm }>(`/farms/${id}`),
    create: (data: Partial<Farm>) => request<{ ok: true; data: Farm }>("/farms", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Farm>) => request<{ ok: true; data: Farm }>(`/farms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<{ ok: true }>(`/farms/${id}`, { method: "DELETE" }),
  },
  crops: {
    list: (farmId?: string) => request<{ ok: true; data: Crop[] }>(`/crops${farmId ? `?farmId=${farmId}` : ""}`),
    create: (data: Partial<Crop>) => request<{ ok: true; data: Crop }>("/crops", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Crop>) => request<{ ok: true; data: Crop }>(`/crops/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<{ ok: true }>(`/crops/${id}`, { method: "DELETE" }),
  },
  market: {
    list: (params: { q?: string; category?: string; minPrice?: number; maxPrice?: number; page?: number } = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && qs.set(k, String(v)));
      return request<{ ok: true; data: Listing[] }>(`/market/listings?${qs}`);
    },
    get: (id: string) => request<{ ok: true; data: Listing }>(`/market/listings/${id}`),
    mine: () => request<{ ok: true; data: Listing[] }>("/market/mine"),
    create: (data: Partial<Listing>) => request<{ ok: true; data: Listing }>("/market/listings", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Listing>) => request<{ ok: true; data: Listing }>(`/market/listings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<{ ok: true }>(`/market/listings/${id}`, { method: "DELETE" }),
  },
  marketPrices: {
    latest: (params: { city?: string; crop?: string } = {}) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => value && qs.set(key, value));
      return request<{ ok: true; data: MarketPrice[]; meta: { latestDate: string | null; stale: boolean } }>(`/market-prices/latest?${qs}`);
    },
    trends: (params: { city: string; crop: string; days?: number }) => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => value && qs.set(key, String(value)));
      return request<{ ok: true; data: MarketPrice[] }>(`/market-prices/trends?${qs}`);
    },
    cities: () => request<{ ok: true; data: string[] }>("/market-prices/cities"),
    crops: () => request<{ ok: true; data: string[] }>("/market-prices/crops"),
  },
  orders: {
    list: (role: "buyer" | "seller" = "buyer") => request<{ ok: true; data: Order[] }>(`/orders?role=${role}`),
    create: (data: { listing_id: string; quantity: number; shipping_address: string }) =>
      request<{ ok: true; data: Order }>("/orders", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: Order["status"]) =>
      request<{ ok: true; data: Order }>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
  notifications: {
    list: () => request<{ ok: true; data: Notification[] }>("/notifications"),
    unreadCount: () => request<{ ok: true; count: number }>("/notifications/unread-count"),
    markRead: (id: string) => request<{ ok: true }>(`/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () => request<{ ok: true }>("/notifications/read-all", { method: "POST" }),
    streamUrl: () => {
      const t = tokenStore.get();
      return `${BASE}/notifications/stream?token=${encodeURIComponent(t || "")}`;
    },
  },
  ai: {
    chat: (message: string, history?: { role: "user" | "assistant"; content: string }[]) =>
      request<{ ok: true; reply: string }>("/ai/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
    priceInsight: (crop: string, region?: string) =>
      request<{ ok: true; insight: string }>("/ai/price-insight", { method: "POST", body: JSON.stringify({ crop, region }) }),
    scan: (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      return request<{ ok: true; result: any }>("/ai/scan", { method: "POST", body: fd });
    },
  },
  weather: {
    byCoords: (lat: number, lng: number) => request<WeatherResponse>(`/weather?lat=${lat}&lng=${lng}`),
    byCity: (q: string) => request<WeatherResponse>(`/weather?q=${encodeURIComponent(q)}`),
  },
};

export interface WeatherResponse {
  ok: true;
  location: { name: string; country?: string; lat: number; lng: number };
  current: { tempC: number; feelsLikeC: number; humidity: number; pressure: number;
    condition: string; description: string; icon: string;
    windKph: number; cloudsPct: number; sunrise: number; sunset: number; };
  hourly: { time: string; tempC: number; icon: string; condition: string; rainMm: number }[];
  daily: { date: string; tempC: number; minC: number; maxC: number; humidity: number; condition: string; description: string; icon: string; windKph: number; rainMm: number }[];
}

export const iconUrl = (icon?: string, size: 2 | 4 = 2) =>
  icon ? `https://openweathermap.org/img/wn/${icon}@${size}x.png` : "";
