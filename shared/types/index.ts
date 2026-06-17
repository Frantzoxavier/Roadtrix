// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'ADMIN',
  DISPATCHER = 'DISPATCHER',
  DRIVER = 'DRIVER',
}

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  ON_TRIP = 'ON_TRIP',
  SUSPENDED = 'SUSPENDED',
}

export enum LoadStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE_PICKUP = 'EN_ROUTE_PICKUP',
  PICKED_UP = 'PICKED_UP',
  EN_ROUTE_DELIVERY = 'EN_ROUTE_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserDTO {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  createdAt: string;
}

// ─── Driver ───────────────────────────────────────────────────────────────────

export interface DriverDTO {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseExpiration: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
  rating: number;
  status: DriverStatus;
  currentLat?: number | null;
  currentLng?: number | null;
  lastLocationAt?: string | null;
  user: UserDTO;
}

export interface CreateDriverRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiration: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export interface LoadDTO {
  id: string;
  sourcePlatform: string;
  externalLoadId?: string | null;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  loadType: string;
  weight: number;
  brokerPayout: number;
  driverPayout: number;
  companyProfit: number;
  status: LoadStatus;
  notes?: string | null;
  createdAt: string;
  assignment?: AssignmentDTO | null;
}

export interface CreateLoadRequest {
  sourcePlatform: string;
  externalLoadId?: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  loadType: string;
  weight: number;
  brokerPayout: number;
  driverPayout: number;
  notes?: string;
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export interface AssignmentDTO {
  id: string;
  loadId: string;
  driverId: string;
  assignedAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  driver?: DriverDTO;
  trip?: TripDTO | null;
}

// ─── Trip ─────────────────────────────────────────────────────────────────────

export interface TripDTO {
  id: string;
  assignmentId: string;
  startedAt?: string | null;
  pickupTime?: string | null;
  deliveryTime?: string | null;
  podImage?: string | null;
  recipientName?: string | null;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface MessageDTO {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: UserDTO;
  receiver?: UserDTO;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface PaymentDTO {
  id: string;
  driverId: string;
  loadId?: string | null;
  amount: number;
  status: PaymentStatus;
  payoutDate?: string | null;
  notes?: string | null;
  createdAt: string;
  driver?: DriverDTO;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsDTO {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  profit: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    margin: number;
  };
  loads: {
    total: number;
    completed: number;
    active: number;
    cancelled: number;
    completionRate: number;
  };
  drivers: {
    total: number;
    active: number;
    onTrip: number;
    available: number;
  };
  revenueByDay: { date: string; revenue: number; profit: number }[];
  topDrivers: { driver: DriverDTO; loads: number; earnings: number }[];
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface DriverLocationUpdatePayload {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface LoadAssignedPayload {
  loadId: string;
  driverId: string;
  load: LoadDTO;
}

export interface LoadAcceptedPayload {
  loadId: string;
  driverId: string;
}

export interface LoadDeliveredPayload {
  loadId: string;
  driverId: string;
  recipientName: string;
}

export interface NewMessagePayload {
  message: MessageDTO;
}
