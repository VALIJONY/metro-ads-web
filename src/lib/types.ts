export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type Role = "admin" | "manager" | "operator" | "viewer";

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: Role;
  phone?: string;
  is_active?: boolean;
  date_joined?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Depot {
  id: number;
  code: string;
  name: string;
  address?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface DepotStats {
  id: number;
  code: string;
  name?: string;
  sellable: number;
  occupied: number;
}

export type TrainStatus = "new" | "old";

export interface Train {
  id: number;
  depot: number;
  depot_detail: { id: number; code: string };
  number: string;
  status: TrainStatus;
  line: string;
  car_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: number;
  train: number;
  position: number;
  serial_number: string;
  type: string;
  created_at: string;
}

export interface AdType {
  id: number;
  name: string;
  unit: string;
  size_type: "area" | "complex";
  default_base_price: string;
  note?: string;
}

export type AdSpaceStatus = "active" | "temporarily_closed" | "prohibited";
export type Side = "left" | "right" | "top" | "bottom" | "exterior";
export type VisualStatus = "free" | "occupied" | "ending" | "closed" | "prohibited";

export interface LayoutBooking {
  id: number;
  ad_name: string;
  price: string;
  start_date: string;
  end_date: string;
  days_left: number;
  contract: { id: number; number: string };
  client: { id: number; name: string };
}

export interface LayoutSpace {
  id: number;
  code: string;
  side: Side;
  position: number;
  area_m2: string;
  base_price: string;
  ad_type: { id: number; name: string };
  status: AdSpaceStatus;
  status_reason?: string;
  visual: VisualStatus;
  booking: LayoutBooking | null;
}

export interface LayoutCar {
  id: number;
  position: number;
  spaces: LayoutSpace[];
}

export interface TrainLayout {
  train: {
    id: number;
    number: string;
    depot: { id: number; code: string };
    status: TrainStatus;
    line: string;
  };
  date: string;
  stats: {
    total_spaces: number;
    sellable: number;
    occupied: number;
    free: number;
    ending: number;
    closed: number;
    prohibited: number;
    occupancy_rate: number;
  };
  cars: LayoutCar[];
}

export interface Client {
  id: number;
  name: string;
  tin?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientStats {
  client_id: number;
  total_contracts: number;
  active_contracts: number;
  bookings_total: string;
  paid: string;
  balance: string;
}

export type ContractStatus = "draft" | "active" | "expired" | "cancelled";

export interface Contract {
  id: number;
  client: number;
  client_detail: { id: number; name: string; tin: string | null };
  number: string;
  date: string;
  start_date: string;
  end_date: string;
  amount: string;
  currency: string;
  status: ContractStatus;
  file: string | null;
  file_name: string;
  bookings_count: number;
  bookings_total: string;
  paid: string;
  balance: string;
  days_left: number;
  cancel_reason: string;
  note: string;
  created_by_detail: { id: number; first_name: string; last_name: string } | null;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = "planned" | "active" | "expired" | "cancelled";

export interface Booking {
  id: number;
  contract: number;
  ad_space: number;
  ad_space_detail: { id: number; code: string };
  ad_name: string;
  start_date: string;
  end_date: string;
  used_area: string;
  quantity: number;
  price: string;
  status: BookingStatus;
  installed_date: string | null;
  removed_date: string | null;
  cancel_reason: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface OccupancyRow {
  id: number;
  number?: string;
  code?: string;
  name?: string;
  sellable: number;
  occupied: number;
  rate: number;
}

export type PaymentType = "transfer" | "cash" | "other";

export interface Payment {
  id: number;
  contract: number;
  amount: string;
  payment_date: string;
  payment_type: PaymentType;
  document_number: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryRow {
  history_id: number;
  history_date: string;
  history_type: "+" | "~" | "-";
  status: string;
  amount: string;
}

export interface SpaceHistoryRow {
  history_id: number;
  history_date: string;
  history_type: "+" | "~" | "-";
  status: string;
  base_price: string;
}

export interface RevenueRow {
  m?: string;
  contract__client__id?: number;
  contract__client__name?: string;
  ad_space__car__train__depot__code?: string;
  total: string;
  count: number;
}

export interface DebtRow {
  contract: { id: number; number: string };
  client: { id: number; name: string };
  amount: string;
  paid: string;
  balance: string;
}

export interface ClientsReportRow {
  id: number;
  name: string;
  tin: string | null;
  bookings_total: string;
  bookings_count: number;
}

export interface OccupancyTrendRow {
  date: string;
  total_spaces: number;
  occupied_spaces: number;
  occupancy_rate: number;
  active_contracts: number;
}

export interface FreeSpace {
  id: number;
  code: string;
  train: { id: number; number: string };
  depot: { id: number; code: string };
  car_position: number;
  side: Side;
  area_m2: string;
  base_price: string;
  ad_type: { id: number; name: string };
}

export interface FreeSpacesResult {
  count: number;
  period: { start_date: string; end_date: string };
  total_area_m2: string;
  total_base_price: string;
  results: FreeSpace[];
}

export interface EndingSoonContract {
  id: number;
  number: string;
  client: { id: number; name: string };
  end_date: string;
  days_left: number;
}

export interface DashboardStats {
  date: string;
  inventory: {
    depots: number;
    trains: number;
    cars: number;
    total_spaces: number;
    sellable_spaces: number;
    prohibited_spaces: number;
    closed_spaces: number;
  };
  occupancy: { occupied: number; free: number; rate: number };
  contracts: { active: number; draft: number; ending_soon: number };
  finance: { month_revenue: string; year_revenue: string; paid: string; debt: string };
  by_depot: DepotStats[];
}
